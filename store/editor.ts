import { defineStore } from "pinia";
import { useToast } from "~/composables/useToast";

interface DraftContent {
  content: string;
  timestamp: string;
  branch: string;
  filePath: string;
}

interface GitContent {
  content: string;
  branch: string;
  sha: string;
  lastFetched: string;
  lastModified: string;
  cdnExpiry: string;
}

interface CommitInfo {
  sha: string;
  message: string;
  date: string;
  branch: string;
}

interface PullRequest {
  number: number;
  title: string;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  mergeable: boolean;
  mergeable_state: string;
}

interface EditorState {
  drafts: Record<string, DraftContent>;
  gitContents: Record<string, GitContent>;
  currentBranch: string;
  collaborators: string[];
  isCollaborating: boolean;
  pullRequests: PullRequest[];
  lastPRUpdate: string;
  branchCache: {
    branches: string[];
    lastFetched: string;
  };
  commitHistory: Record<string, CommitInfo[]>; // key is filePath
}

export const useEditorStore = defineStore("editor", {
  state: (): EditorState => ({
    drafts: {},
    gitContents: {},
    currentBranch: "main",
    collaborators: [],
    isCollaborating: false,
    pullRequests: [],
    lastPRUpdate: new Date().toISOString(),
    branchCache: {
      branches: [],
      lastFetched: new Date().toISOString(),
    },
    commitHistory: {},
  }),

  getters: {
    getDraft: (state) => (filePath: string) => {
      const key = `${filePath}-${state.currentBranch}`;
      return state.drafts[key];
    },

    hasDraft: (state) => (filePath: string) => {
      const key = `${filePath}-${state.currentBranch}`;
      return !!state.drafts[key];
    },

    getGitContent: (state) => (filePath: string, branch: string) => {
      const key = `${filePath}-${branch}`;
      return state.gitContents[key];
    },

    getCurrentGitContent: (state) => (filePath: string) => {
      const key = `${filePath}-${state.currentBranch}`;
      return state.gitContents[key];
    },

    getPullRequests: (state) => () => {
      return state.pullRequests;
    }
  },

  actions: {
    saveDraft(filePath: string, content: string) {
      const { showToast } = useToast();
      const key = `${filePath}-${this.currentBranch}`;
      
      this.drafts[key] = {
        content: content.toString(),
        timestamp: new Date().toISOString(),
        branch: this.currentBranch,
        filePath,
      };

      try {
        localStorage.setItem("editor-drafts", JSON.stringify(this.drafts));
        showToast({
          title: "Draft Saved",
          message: `Draft saved for "${filePath}" on branch "${this.currentBranch}"`,
          type: "success"
        });
      } catch (error) {
        console.error("Error saving draft:", error);
        showToast({
          title: "Error",
          message: "Failed to save draft",
          type: "error"
        });
      }
    },

    clearDraft(filePath: string) {
      const { showToast } = useToast();
      const key = `${filePath}-${this.currentBranch}`;
      
      if (this.drafts[key]) {
        delete this.drafts[key];
        localStorage.setItem("editor-drafts", JSON.stringify(this.drafts));
        
        showToast({
          title: "Draft Cleared",
          message: `Draft cleared for "${filePath}" on branch "${this.currentBranch}"`,
          type: "success"
        });
      }
    },

    saveGitContent(filePath: string, content: string, branch: string, sha: string) {
      const key = `${filePath}-${branch}`;
      this.gitContents[key] = {
        content,
        branch,
        sha,
        lastFetched: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        cdnExpiry: new Date().toISOString(),
      };

      localStorage.setItem("editor-git-contents", JSON.stringify(this.gitContents));
    },

    setBranch(branch: string) {
      this.currentBranch = branch;
      if (process.client) {
        localStorage.setItem("github-current-branch", branch);
      }
    },

    clearGitContent(filePath: string, branch: string) {
      const key = `${filePath}-${branch}`;
      if (this.gitContents[key]) {
        delete this.gitContents[key];
        localStorage.setItem("editor-git-contents", JSON.stringify(this.gitContents));
      }
    },

    setCollaborators(collaborators: string[]) {
      this.collaborators = collaborators;
    },

    setIsCollaborating(value: boolean) {
      this.isCollaborating = value;
    },

    updateContent(filePath: string, content: string) {
      const gitKey = `${filePath}-${this.currentBranch}`;
      if (this.gitContents[gitKey]) {
        this.gitContents[gitKey].content = content;
        this.gitContents[gitKey].lastFetched = new Date().toISOString();
      }
      
      // Save as draft
      this.saveDraft(filePath, content);
    },

    addPullRequest(pr: PullRequest) {
      this.pullRequests.unshift(pr);
      this.lastPRUpdate = new Date().toISOString();
      localStorage.setItem("editor-pull-requests", JSON.stringify(this.pullRequests));
    },

    updatePullRequests(prs: PullRequest[]) {
      this.pullRequests = prs;
      this.lastPRUpdate = new Date().toISOString();
      localStorage.setItem("editor-pull-requests", JSON.stringify(this.pullRequests));
    },

    updateBranchCache(branchList: string[]) {
      this.branchCache = {
        branches: branchList,
        lastFetched: new Date().toISOString(),
      };
      
      if (process.client) {
        localStorage.setItem('editor-branch-cache', JSON.stringify(this.branchCache));
      }
    },

    updateContentTimestamp(filePath: string, branch: string) {
      const key = `${filePath}-${branch}`;
      if (this.gitContents[key]) {
        this.gitContents[key] = {
          ...this.gitContents[key],
          lastFetched: new Date().toISOString()
        };
      }
    },

    // Initialize store from localStorage
    initializeStore() {
      if (process.client) {
        try {
          // Load drafts
          const savedDrafts = localStorage.getItem("editor-drafts");
          if (savedDrafts) {
            this.drafts = JSON.parse(savedDrafts);
          }

          // Load git contents
          const savedGitContents = localStorage.getItem("editor-git-contents");
          if (savedGitContents) {
            this.gitContents = JSON.parse(savedGitContents);
          }

          // Load pull requests
          const savedPRs = localStorage.getItem("editor-pull-requests");
          if (savedPRs) {
            this.pullRequests = JSON.parse(savedPRs);
          }

          // Load branch cache
          const savedBranchCache = localStorage.getItem("editor-branch-cache");
          if (savedBranchCache) {
            this.branchCache = JSON.parse(savedBranchCache);
          }

          // Load current branch
          const savedBranch = localStorage.getItem("github-current-branch");
          if (savedBranch) {
            this.currentBranch = savedBranch;
          }
        } catch (error) {
          console.error("Error initializing editor store:", error);
        }
      }
    }
  },
});
