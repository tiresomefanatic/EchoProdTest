// composables/useNavigation.ts
import { ref } from "vue";
import { useGithub } from "./useGithub";
import { useRuntimeConfig } from "#app";
import { Octokit } from "@octokit/rest";

interface BaseNavigationItem {
  title: string;
  path: string;
  locked: boolean;
}

interface DirectoryItem extends BaseNavigationItem {
  type: "directory";
  children: NavigationItem[];
}

interface FileItem extends BaseNavigationItem {
  type: "file";
}

type NavigationItem = DirectoryItem | FileItem;

export const useNavigation = () => {
  const { currentBranch, getRawContent } = useGithub();
  const config = useRuntimeConfig();
  const navigationStructure = ref<NavigationItem[]>([]);
  const isLoading = ref(false);

  // Initialize Octokit with stored token
  const getOctokit = () => {
    if (process.client) {
      const token = localStorage.getItem("github_token");
      if (token) {
        return new Octokit({ auth: token });
      }
    }
    return new Octokit();
  };

  // List of locked paths - could be moved to a config file
  const lockedPaths = [
    "illustration",
    "icons",
    "layout",
    "imagery",
    "animation",
    "applications",
    "digital",
    "sound",
  ];

  // Helper function to check if a path is locked
  const isPathLocked = (name: string): boolean => {
    return lockedPaths.some((lockedPath) =>
      name.toLowerCase().includes(lockedPath.toLowerCase())
    );
  };

  // Format the title from a filename or path
  const formatTitle = (name: string): string => {
    return name
      .replace(/\.md$/, "")
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format the path for routing
  const formatPath = (path: string): string => {
    return "/" + path.replace(/^content\//, "").replace(/\.md$/, "");
  };

  // Extract title from markdown frontmatter
  const extractTitleFromContent = (content: string): string | null => {
    const titleMatch = content.match(/^---\s*\n(?:.*\n)*title:\s*(.+)\s*\n/);
    return titleMatch ? titleMatch[1].trim() : null;
  };

  // Type guard to check if an item is a NavigationItem
  const isNavigationItem = (item: any): item is NavigationItem => {
    return (
      item !== null &&
      typeof item === "object" &&
      "title" in item &&
      "path" in item &&
      "locked" in item &&
      "type" in item &&
      (item.type === "file" ||
        (item.type === "directory" && Array.isArray(item.children)))
    );
  };

  // Get directory contents from GitHub API
  const getDirectoryContents = async (path: string) => {
    try {
      const octokit = getOctokit();
      const { data } = await octokit.rest.repos.getContent({
        owner: config.public.githubOwner,
        repo: config.public.githubRepo,
        path,
        ref: currentBranch.value,
      });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error getting directory contents:", error);
      return [];
    }
  };

  // Main function to scan directory and build navigation
  const scanDirectory = async (
    path: string = "content/design"
  ): Promise<NavigationItem[]> => {
    try {
      const contents = await getDirectoryContents(path);

      const items = await Promise.all(
        contents.map(async (item) => {
          const isLocked = isPathLocked(item.name);
          const itemPath = formatPath(item.path);

          if (item.type === "dir") {
            const children = await scanDirectory(item.path);
            return {
              title: formatTitle(item.name),
              path: itemPath,
              locked: isLocked,
              type: "directory" as const,
              children,
            } satisfies DirectoryItem;
          } else if (item.name.endsWith(".md")) {
            const content = await getRawContent(
              config.public.githubOwner,
              config.public.githubRepo,
              item.path,
              currentBranch.value
            );
            const title =
              extractTitleFromContent(content) || formatTitle(item.name);
            return {
              title,
              path: itemPath,
              locked: isLocked,
              type: "file" as const,
            } satisfies FileItem;
          }
          return null;
        })
      );

      return items.filter(isNavigationItem);
    } catch (error) {
      console.error("Error scanning directory:", error);
      return [];
    }
  };

  // Function to refresh navigation structure
  const refreshNavigation = async () => {
    isLoading.value = true;
    try {
      const structure = await scanDirectory();
      navigationStructure.value = structure;
    } catch (error) {
      console.error("Error refreshing navigation:", error);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    navigationStructure,
    isLoading,
    refreshNavigation,
  };
};
