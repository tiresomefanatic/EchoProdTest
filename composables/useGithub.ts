// useGithub.ts
import { Octokit } from "@octokit/rest";
import { useRuntimeConfig, navigateTo, useState } from "#app";
import { ref, onMounted, computed } from "vue";
import { useEditorStore } from "~/store/editor";
import { useToast } from "~/composables/useToast";

// Define interfaces for all GitHub-related data structures
export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
  id: number;
}

export interface PullRequest {
  number: number;
  title: string;
  user: GitHubUser;
  html_url: string;
  mergeable: boolean;
  mergeable_state: string;
  files?: Array<{
    filename: string;
    patch?: string;
  }>;
  base: {
    ref: string;
  };
  head: {
    ref: string;
  };
}

export interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author?: {
    avatar_url: string;
  };
}

interface ContentResponse {
  content: string;
  sha: string;
  lastFetched: string;
}

// Main composable function for GitHub functionality
export const useGithub = () => {
  // Initialize runtime configuration and state
  const config = useRuntimeConfig();
  const user = ref<GitHubUser | null>(null);
  const loading = ref(false);
  // Change the currentBranch state to use localStorage
  const currentBranch = useState<string>("github-current-branch", () => {
    if (process.client) {
      // Try to get saved branch from localStorage first
      const savedBranch = localStorage.getItem("github-current-branch");
      return savedBranch || "main";
    }
    return "main";
  });
  const branches = useState<string[]>("github-branches", () => []);

  // Initialize Octokit with stored token if available
  const octokit = new Octokit({
    auth: process.client ? localStorage.getItem("github_token") : undefined,
  });

  // Handle GitHub OAuth login
  const initiateLogin = () => {
    if (!process.client) return;

    const params = new URLSearchParams({
      client_id: config.public.githubClientId,
      redirect_uri: `${config.public.siteUrl}/auth/callback`,
      scope: "user repo",
      response_type: "code",
      allow_signup: "true",
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  };

  // Handle user logout
  const handleLogout = () => {
    if (!process.client) return;
    localStorage.removeItem("github_token");
    user.value = null;
  };

  // Check if user is logged in
  const isLoggedIn = computed(() => {
    if (!process.client) return false;
    return !!localStorage.getItem("github_token");
  });

  // Fetch authenticated user data
  const fetchUserData = async (): Promise<GitHubUser | null> => {
    if (!process.client) return null;

    const token = localStorage.getItem("github_token");
    if (!token) return null;

    loading.value = true;
    try {
      const { data } = await octokit.rest.users.getAuthenticated();
      user.value = data as GitHubUser;
      return data as GitHubUser;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Track latest SHA and content for each file
  const latestSHA = new Map<string, string>();
  const latestContent = new Map<string, string>();

  // Helper functions for commit storage
  const COMMIT_STORAGE_PREFIX = "github_commit_";

  const getCommitStorageKey = (
    owner: string,
    repo: string,
    path: string,
    branch: string
  ) => `${COMMIT_STORAGE_PREFIX}${owner}_${repo}_${path}_${branch}`;

  const saveCommitContent = (
    owner: string,
    repo: string,
    path: string,
    branch: string,
    content: string,
    sha: string
  ) => {
    if (process.client) {
      const key = getCommitStorageKey(owner, repo, path, branch);
      const data = {
        content,
        sha,
      };
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  const getCommitContent = (
    owner: string,
    repo: string,
    path: string,
    branch: string
  ) => {
    if (process.client) {
      const key = getCommitStorageKey(owner, repo, path, branch);
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return null;
  };

  const clearCommitContent = (
    owner: string,
    repo: string,
    path: string,
    branch: string
  ) => {
    if (process.client) {
      const key = getCommitStorageKey(owner, repo, path, branch);
      localStorage.removeItem(key);
    }
  };

  // Get file content from GitHub
  const getFileContent = async (
    owner: string,
    repo: string,
    path: string,
    branch?: string
  ) => {
    if (!isLoggedIn.value) {
      throw new Error("Authentication required to get content");
    }

    const targetBranch = branch || currentBranch.value;
    const fileKey = `${owner}/${repo}/${path}/${targetBranch}`;

    try {
      // If we have the latest content (after a commit), use that
      const latestSha = latestSHA.get(fileKey);
      const content = latestContent.get(fileKey);
      if (latestSha && content) {
        console.log(`Using latest cached content for ${path}`);
        return {
          content,
          sha: latestSha,
        };
      }

      // Otherwise fetch from GitHub
      console.log("Fetching from GitHub:", {
        owner,
        repo,
        path,
        ref: targetBranch,
      });

      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: targetBranch,
      });

      if (!("content" in data)) {
        throw new Error("Not a file");
      }

      const decodedContent = decodeBase64ToString(data.content);

      // Store the content and SHA
      if ("sha" in data) {
        latestSHA.set(fileKey, data.sha);
        latestContent.set(fileKey, decodedContent);
      }

      return {
        content: decodedContent,
        sha: "sha" in data ? data.sha : null,
      };
    } catch (error) {
      console.error("Error getting file content:", error);
      throw error;
    }
  };

  // Add inside useGithub composable
  const pollContent = ref<ReturnType<typeof setInterval> | null>(null);

  const fetchAndCompareContent = async (
    owner: string,
    repo: string,
    path: string,
    branch: string
  ): Promise<ContentResponse> => {
    const editorStore = useEditorStore();
    const currentContent = editorStore.getGitContent(path, branch);

    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      // Type guard to ensure we're dealing with a file
      if ('content' in data && !Array.isArray(data)) {
        const content = decodeBase64ToString(data.content);
        
        // Compare both SHA and content
        if (currentContent && 
            data.sha === currentContent.sha && 
            content === currentContent.content) {
          // No changes detected
          editorStore.updateContentTimestamp(path, branch);
          return {
            content: currentContent.content,
            sha: currentContent.sha,
            lastFetched: new Date().toISOString()
          };
        }

        // Either SHA or content has changed
        const newContent = {
          content,
          sha: data.sha,
          lastFetched: new Date().toISOString()
        };

        editorStore.saveGitContent(path, content, branch, data.sha);
        return newContent;
      }
      throw new Error('Not a file');
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  };

  // Update getRawContent to use the polling mechanism
  const getRawContent = async (
    owner: string,
    repo: string,
    path: string,
    branch: string = currentBranch.value
  ): Promise<string> => {
    // Initial fetch
    const response = await fetchAndCompareContent(owner, repo, path, branch);

    // Setup polling if not already running for this path
    if (!pollContent.value) {
      pollContent.value = setInterval(async () => {
        try {
          await fetchAndCompareContent(owner, repo, path, branch);
        } catch (error) {
          console.error('Error in content poll:', error);
        }
      }, 5 * 60 * 1000); // Poll every 5 minutes
    }

    return response.content;
  };

  // Add cleanup function
  const clearContentPolling = () => {
    if (pollContent.value) {
      clearInterval(pollContent.value);
      pollContent.value = null;
    }
  };

  // Save file content with improved error handling
  const saveFileContent = async (
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch?: string,
    force?: boolean,
    sha?: string | null
  ) => {
    if (!isLoggedIn.value) {
      throw new Error("Authentication required to save content");
    }

    const targetBranch = branch || currentBranch.value;
    const fileKey = `${owner}/${repo}/${path}/${targetBranch}`;

    try {
      // First verify branch exists
      await octokit.rest.repos.getBranch({
        owner,
        repo,
        branch: targetBranch,
      });

      // Use SHA from commit storage or parameter
      const commitData = getCommitContent(owner, repo, path, targetBranch);
      let fileSha = commitData?.sha || sha;

      if (!fileSha && !force) {
        try {
          const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref: targetBranch,
          });

          if ("sha" in data) {
            fileSha = data.sha;
          }
        } catch (error) {
          if (error.status !== 404) {
            throw error;
          }
        }
      }

      const updateParams = {
        owner,
        repo,
        path,
        message: `${message} [branch: ${targetBranch}]`,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: targetBranch,
        sha: !force && fileSha ? fileSha : undefined,
      };

      const result = await octokit.rest.repos.createOrUpdateFileContents(
        updateParams
      );

      // Save to commit storage
      if (result.data.content?.sha) {
        saveCommitContent(
          owner,
          repo,
          path,
          targetBranch,
          content,
          result.data.content.sha
        );
      }

      return result.data;
    } catch (error) {
      if (error.status === 409) {
        // Clear commit storage on conflict
        clearCommitContent(owner, repo, path, targetBranch);
      }
      throw error;
    }
  };

  // Create a new file or folder
  const createNewContent = async (
    path: string,
    content: string = "",
    isFolder: boolean = false
  ) => {
    if (!isLoggedIn.value) return null;

    try {
      const owner = config.public.githubOwner;
      const repo = config.public.githubRepo;

      if (isFolder) {
        // GitHub doesn't have direct folder creation - we create a .gitkeep file
        const folderPath = path.endsWith("/")
          ? `${path}.gitkeep`
          : `${path}/.gitkeep`;
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: folderPath,
          message: `Create new folder: ${path}`,
          content: btoa(""),
          branch: currentBranch.value,
        });
      } else {
        // Create new file
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message: `Create new file: ${path}`,
          content: btoa(unescape(encodeURIComponent(content))),
          branch: currentBranch.value,
        });
      }

      return true;
    } catch (error) {
      console.error("Error creating content:", error);
      throw error;
    }
  };

  // Delete a file or folder
  const deleteContent = async (path: string) => {
    if (!isLoggedIn.value) return null;

    try {
      const owner = config.public.githubOwner;
      const repo = config.public.githubRepo;

      // Get the file's SHA
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: currentBranch.value,
      });

      if (Array.isArray(fileData)) {
        // It's a directory - delete all files recursively
        for (const file of fileData) {
          await deleteContent(file.path);
        }
      } else {
        // Delete single file
        await octokit.rest.repos.deleteFile({
          owner,
          repo,
          path,
          message: `Delete: ${path}`,
          sha: fileData.sha,
          branch: currentBranch.value,
        });
      }

      return true;
    } catch (error) {
      console.error("Error deleting content:", error);
      throw error;
    }
  };

  // Handle branch change
  const switchBranch = async (branch: string) => {
    currentBranch.value = branch;
    if (process.client) {
      localStorage.setItem("github-current-branch", branch);
    }
  };

  // Fetch branches
  const fetchBranches = async () => {
    if (!process.client) return;
    const token = localStorage.getItem("github_token");
    if (!token) return;

    loading.value = true;
    try {
      const { data } = await octokit.rest.repos.listBranches({
        owner: config.public.githubOwner,
        repo: config.public.githubRepo,
        per_page: 100,
      });

      const githubBranches = data.map(branch => branch.name);
      
      // Combine GitHub branches with pending branches
      branches.value = [...new Set([...githubBranches])].sort();
      
      loading.value = false;
      return branches.value;
    } catch (error) {
      loading.value = false;
      console.error("Error fetching branches:", error);
      throw error;
    }
  };

  // Create a new branch
  const createBranch = async (branchName: string) => {
    if (!isLoggedIn.value) return null;

    const { showToast, updateToast, dismissToast } = useToast();
    const toastId = 'branch-creation';

    try {
      showToast({
        id: toastId,
        title: "Creating Branch",
        message: `Creating new branch: ${branchName}...`,
        type: "loading",
        duration: 0,
      });

      // Get current branch's latest commit
      const { data: currentRef } = await octokit.rest.git.getRef({
        owner: "tiresomefanatic",
        repo: "EchoProdTest",
        ref: `heads/${currentBranch.value}`,
      });

      // Create new branch
      await octokit.rest.git.createRef({
        owner: "tiresomefanatic",
        repo: "EchoProdTest",
        ref: `refs/heads/${branchName}`,
        sha: currentRef.object.sha,
      });

      updateToast(toastId, {
        message: "Waiting for GitHub to process...",
      });

      // Verify branch exists with longer timeout and less frequent polling
      let attempts = 0;
      while (attempts < 6) { // Try for 3 minutes (6 attempts * 30 seconds)
        const { data } = await octokit.rest.repos.listBranches({
          owner: "tiresomefanatic",
          repo: "EchoProdTest",
          per_page: 100,
        });
        
        if (data.some(b => b.name === branchName)) {
          branches.value = data.map(b => b.name);
          await switchBranch(branchName);

          updateToast(toastId, {
            title: "Branch Created",
            message: `Successfully created and verified branch: ${branchName}`,
            type: "success",
            duration: 3000,
          });

          return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        attempts++;

        // Update toast with attempt count
        updateToast(toastId, {
          message: ` Waiting for GitHub to process... (Attempt ${attempts}/6)`,
        });
      }

      // If we get here, verification timed out
      updateToast(toastId, {
        title: "Branch Created",
        message: `Branch has been created but might take a few more minutes to be available. Please refresh the page later.`,
        type: "warning",
        duration: 5000,
      });

      return true;

    } catch (error) {
      console.error("Error creating branch:", error);
      
      updateToast(toastId, {
        title: "Error",
        message: "Failed to create branch. Please try again.",
        type: "error",
        duration: 3000,
      });

      return null;
    }
  };

  // Delete an existing branch
  const deleteBranch = async (branchName: string) => {
    if (!isLoggedIn.value) return null;

    const { showToast, updateToast, dismissToast } = useToast();
    const toastId = 'branch-deletion';

    try {
      showToast({
        id: toastId,
        title: "Deleting Branch",
        message: `Deleting branch: ${branchName}...`,
        type: "loading",
        duration: 0,
      });

      // Delete the branch
      await octokit.rest.git.deleteRef({
        owner: "tiresomefanatic",
        repo: "EchoProdTest",
        ref: `heads/${branchName}`,
      });

      updateToast(toastId, {
        message: " Waiting for GitHub to process...",
      });

      // Verify branch is removed with longer timeout and less frequent polling
      let attempts = 0;
      while (attempts < 6) { // Try for 3 minutes (6 attempts * 30 seconds)
        const { data } = await octokit.rest.repos.listBranches({
          owner: "tiresomefanatic",
          repo: "EchoProdTest",
          per_page: 100,
        });
        
        // Check if branch is no longer in the list
        if (!data.some(b => b.name === branchName)) {
          branches.value = data.map(b => b.name);

          updateToast(toastId, {
            title: "Branch Deleted",
            message: `Successfully deleted and verified removal of branch: ${branchName}`,
            type: "success",
            duration: 3000,
          });

          return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        attempts++;

        // Update toast with attempt count
        updateToast(toastId, {
          message: ` Waiting for GitHub to process... (Attempt ${attempts}/6)`,
        });
      }

      // If we get here, verification timed out
      updateToast(toastId, {
        title: "Branch Deleted",
        message: `Branch has been deleted but might take a few more minutes to be fully removed. Please refresh the page later.`,
        type: "warning",
        duration: 5000,
      });

      return true;

    } catch (error) {
      console.error("Error deleting branch:", error);
      
      updateToast(toastId, {
        title: "Error",
        message: "Failed to delete branch. Please try again.",
        type: "error",
        duration: 3000,
      });

      return null;
    }
  };

  // Duplicate an existing branch
  const duplicateBranch = async (sourceBranchName: string, newBranchName: string) => {
    if (!isLoggedIn.value) return null;

    const { showToast, updateToast, dismissToast } = useToast();
    const toastId = 'branch-duplication';

    try {
      showToast({
        id: toastId,
        title: "Duplicating Branch",
        message: `Duplicating branch "${sourceBranchName}" to "${newBranchName}"...`,
        type: "loading",
        duration: 0,
      });

      // Get source branch's latest commit
      const { data: sourceRef } = await octokit.rest.git.getRef({
        owner: "tiresomefanatic",
        repo: "EchoProdTest",
        ref: `heads/${sourceBranchName}`,
      });

      // Create new branch based on the source branch's commit
      await octokit.rest.git.createRef({
        owner: "tiresomefanatic",
        repo: "EchoProdTest",
        ref: `refs/heads/${newBranchName}`,
        sha: sourceRef.object.sha,
      });

      updateToast(toastId, {
        message: " Waiting for GitHub to process...",
      });

      // Verify branch exists with longer timeout and less frequent polling
      let attempts = 0;
      while (attempts < 6) { // Try for 3 minutes (6 attempts * 30 seconds)
        const { data } = await octokit.rest.repos.listBranches({
          owner: "tiresomefanatic",
          repo: "EchoProdTest",
          per_page: 100,
        });
        
        if (data.some(b => b.name === newBranchName)) {
          branches.value = data.map(b => b.name);
          
          updateToast(toastId, {
            title: "Branch Duplicated",
            message: `Successfully duplicated "${sourceBranchName}" to "${newBranchName}"`,
            type: "success",
            duration: 3000,
          });

          return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        attempts++;

        // Update toast with attempt count
        updateToast(toastId, {
          message: `Waiting for GitHub to process... (Attempt ${attempts}/6)`,
        });
      }

      // If we get here, verification timed out
      updateToast(toastId, {
        title: "Branch Duplicated",
        message: `Branch has been duplicated but might take a few more minutes to be available. Please refresh the page later.`,
        type: "warning",
        duration: 5000,
      });

      return true;

    } catch (error) {
      console.error("Error duplicating branch:", error);
      
      updateToast(toastId, {
        title: "Error",
        message: "Failed to duplicate branch. Please try again.",
        type: "error",
        duration: 3000,
      });

      return null;
    }
  };

  // Get list of pull requests
  const fetchPullRequests = async () => {
    if (!isLoggedIn.value) return [];

    try {
      const { data } = await octokit.rest.pulls.list({
        owner: "tiresomefanatic",
        repo: "EchoProdTest",
        state: "open",
      });

      const detailedPRs = await Promise.all(
        data.map(async (pr) => {
          const { data: prDetails } = await octokit.rest.pulls.get({
            owner: "tiresomefanatic",
            repo: "EchoProdTest",
            pull_number: pr.number,
          });
          return prDetails;
        })
      );

      return detailedPRs as PullRequest[];
    } catch (error) {
      console.error("Error fetching pull requests:", error);
      return [];
    }
  };

  // Get list of commits
  const fetchCommits = async () => {
    if (!isLoggedIn.value) return [];

    try {
      const { data } = await octokit.rest.repos.listCommits({
        owner: "tiresomefanatic",
        repo: "EchoProdTest",
        per_page: 10,
      });

      return data as Commit[];
    } catch (error) {
      console.error("Error fetching commits:", error);
      return [];
    }
  };

  // Create a new pull request
  const createNewPullRequest = async (
    base: string,
    head: string,
    title: string,
    body: string
  ) => {
    if (!isLoggedIn.value) return null;

    try {
      // Validate both branches exist
      try {
        await octokit.rest.repos.getBranch({
          owner: "tiresomefanatic",
          repo: "EchoProdTest",
          branch: base,
        });
        await octokit.rest.repos.getBranch({
          owner: "tiresomefanatic",
          repo: "EchoProdTest",
          branch: head,
        });
      } catch (error) {
        console.error("Branch validation failed:", error);
        throw new Error(`One or both branches (${base}, ${head}) do not exist`);
      }

      const { data } = await octokit.rest.pulls.create({
        owner: "tiresomefanatic",
        repo: "EchoProdTest",
        base,
        head,
        title,
        body,
      });
      return data;
    } catch (error) {
      console.error("Error creating pull request:", error);
      throw error;
    }
  };

  // Resolve merge conflicts
  const resolveConflictInFile = async (
    prNumber: number,
    filePath: string,
    resolution: "ours" | "theirs"
  ) => {
    if (!isLoggedIn.value) return null;

    try {
      const { data: pr } = await octokit.rest.pulls.get({
        owner: "tiresomefanatic",
        repo: "EchoProdTest",
        pull_number: prNumber,
      });

      const resolutionBranch = `conflict-resolution-${prNumber}-${Date.now()}`;

      await createBranch(resolutionBranch);

      // Get content based on resolution choice
      let content;
      if (resolution === "ours") {
        content = await getRawContent(
          "tiresomefanatic",
          "EchoProdTest",
          filePath,
          pr.base.ref
        );
      } else {
        content = await getRawContent(
          "tiresomefanatic",
          "EchoProdTest",
          filePath,
          pr.head.ref
        );
      }

      if (!content) {
        throw new Error("Could not get file content");
      }

      await saveFileContent(
        "tiresomefanatic",
        "EchoProdTest",
        filePath,
        content,
        `Resolve conflict in ${filePath} using ${resolution} changes`,
        resolutionBranch
      );

      return true;
    } catch (error) {
      console.error("Error resolving conflict:", error);
      return null;
    }
  };

  // Upload an image to the public folder
  const uploadImage = async (
    file: File,
    subfolder: string = "images"
  ): Promise<string> => {
    if (!isLoggedIn.value) {
      throw new Error("Authentication required to upload images");
    }

    try {
      // Read file as base64
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Generate a unique filename using timestamp
      const timestamp = new Date().getTime();
      const filename = `${timestamp}-${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "-"
      )}`;
      const path = `public/${subfolder}/${filename}`;

      // Upload to GitHub
      const result = await octokit.rest.repos.createOrUpdateFileContents({
        owner: config.public.githubOwner,
        repo: config.public.githubRepo,
        path,
        message: `Upload image: ${filename}`,
        content: base64Content,
        branch: currentBranch.value,
      });

      // Return the URL to the uploaded image
      return `https://raw.githubusercontent.com/${config.public.githubOwner}/${config.public.githubRepo}/${currentBranch.value}/${path}`;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Get repository information
  const getRepoInfo = () => {
    if (process.client) {
      const repoInfo = localStorage.getItem("github_repo_info");
      if (repoInfo) {
        return JSON.parse(repoInfo);
      }
    }
    return {
      owner: "tiresomefanatic",
      repo: "EchoProdTest",
    };
  };

  // Initial setup
  if (process.client) {
    // Fetch user data on initialization if logged in
    if (isLoggedIn.value) {
      fetchUserData();
      fetchBranches();
    }
  }

  // Return the composable API
  return {
    user,
    loading,
    currentBranch,
    branches,
    login: initiateLogin,
    logout: handleLogout,
    isLoggedIn,
    getRawContent,
    saveFileContent,
    getPullRequests: fetchPullRequests,
    getCommits: fetchCommits,
    resolveConflict: resolveConflictInFile,
    fetchBranches,
    createBranch,
    switchBranch,
    createNewPullRequest,
    getFileContent,
    createNewContent,
    deleteContent,
    uploadImage,
    getRepoInfo,
    clearContentPolling,
    deleteBranch,
    duplicateBranch,
  };
};

function decodeBase64ToString(base64String: string): string {
  return decodeURIComponent(
    escape(window.atob(base64String.replace(/\n/g, "")))
  );
}
