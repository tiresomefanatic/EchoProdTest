// store/navigation.ts
import { defineStore } from "pinia";
import { useToast } from "~/composables/useToast";
import { useGithub } from "~/composables/useGithub";
import { useRuntimeConfig } from "#app";
import { useSidebarEditorStore } from "~/store/sidebarEditor";

// Type definitions
interface BaseNavigationItem {
  title: string;
  path: string;
  type: "file" | "directory";
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

interface NavigationData {
  navigation: NavigationItem[];
}

interface NavigationStructure {
  navigation: NavigationItem[];
  lastFetched: string;
  branch: string;
  lastGithubFetch: string; // Add timestamp for GitHub fetch
}

interface NavigationState {
  structures: Record<string, NavigationStructure>;
  currentBranch: string;
  isLoading: boolean;
  error: string | null;
  lastCommitTime: string | null; // Track when changes were committed
  lastGithubStructureHash: string | null;
}

// Safe localStorage operations
const getSavedState = (): Record<string, NavigationStructure> | null => {
  if (typeof window === "undefined") return null;
  try {
    const savedState = localStorage.getItem("navigation-structure");
    return savedState ? JSON.parse(savedState) : null;
  } catch (e) {
    console.warn("Failed to load navigation from localStorage:", e);
    return null;
  }
};

const saveToLocalStorage = (data: Record<string, NavigationStructure>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("navigation-structure", JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save navigation to localStorage:", e);
  }
};

export const useNavigationStore = defineStore("navigation", {
  state: (): NavigationState => ({
    structures: getSavedState() || {},
    currentBranch: "sidebar", // Default to 'sidebar' since that's what we see in logs
    isLoading: false,
    error: null,
    lastCommitTime: null,
    lastGithubStructureHash: null,
  }),

  getters: {
    getCurrentStructure: (state): NavigationItem[] => {
      console.log("Getting current structure for branch:", state.currentBranch);
      console.log("Available structures:", Object.keys(state.structures));
      
      if (!state.structures[state.currentBranch]) {
        console.log("No structure found for current branch");
        return [];
      }
      
      const structure = state.structures[state.currentBranch].navigation;
      console.log("Returning structure:", structure);
      return structure || [];
    },

    isStale: (state) => (branch: string) => {
      const structure = state.structures[branch];
      if (!structure?.lastFetched) return true;

      // Consider data stale after 6 minutes (to ensure it's longer than GitHub's CDN cache)
      const staleTime = 6 * 60 * 1000; // 360,000 milliseconds = 6 minutes
      const now = new Date().getTime();
      const lastFetch = new Date(structure.lastFetched).getTime();

      return now - lastFetch > staleTime;
    },

    isGithubFetchStale: (state) => (branch: string) => {
      const structure = state.structures[branch];
      if (!structure?.lastGithubFetch) return true;

      // Consider GitHub data stale after 6 minutes (to ensure it's longer than GitHub's CDN cache)
      const staleTime = 6 * 60 * 1000; // 360,000 milliseconds = 6 minutes
      const now = new Date().getTime();
      const lastFetch = new Date(structure.lastGithubFetch).getTime();

      return now - lastFetch > staleTime;
    },

    isDirectory:
      () =>
      (item: NavigationItem): item is DirectoryItem => {
        return item.type === "directory";
      },
  },

  actions: {
    applyDraft(draftData: any) {
      if (!draftData) return;
      
      // Update the local structure with draft data
      this.structures[this.currentBranch] = {
        navigation: draftData.navigation,
        lastFetched: new Date().toISOString(),
        branch: this.currentBranch,
        lastGithubFetch: this.structures[this.currentBranch]?.lastGithubFetch || new Date().toISOString(),
      };
      
      // Save to localStorage
      saveToLocalStorage(this.structures);
    },

    updateLastCommitTime() {
      this.lastCommitTime = new Date().toISOString();
    },

    hasDraftChanges() {
      if (!process.client) return false;
      
      // Use direct import instead of require
      const sidebarEditorStore = useSidebarEditorStore();
      return sidebarEditorStore.hasDraftChanges;
    },

    async fetchNavigation(forceFetch = false) {
      const { currentBranch, getRawContent } = useGithub();
      const { showToast } = useToast();
      const config = useRuntimeConfig();
      
      console.log("Starting fetchNavigation, forceFetch:", forceFetch);
      console.log("Current branch:", currentBranch.value);
      
      // Set loading state at the start
      this.isLoading = true;
      this.error = null;
      
      // Set current branch
      this.currentBranch = currentBranch.value;
      
      const sidebarEditorStore = useSidebarEditorStore();
      const draftData = sidebarEditorStore.getDraftNavigationStructure();
      
      // Force fetch from GitHub if forceFetch is true or GitHub data is stale
      const shouldFetchFromGithub = forceFetch || 
        this.isGithubFetchStale(currentBranch.value) || 
        !this.structures[currentBranch.value]?.navigation.length;
      
      // Use draft if it exists and we're not forcing a fetch from GitHub
      if (draftData && !shouldFetchFromGithub) {
        console.log("Using draft navigation structure");
        this.structures[currentBranch.value] = {
          navigation: draftData.navigation,
          lastFetched: new Date().toISOString(),
          branch: currentBranch.value,
          lastGithubFetch: this.structures[currentBranch.value]?.lastGithubFetch || new Date().toISOString(),
        };
        
        // Save to localStorage
        saveToLocalStorage(this.structures);
        // Set loading state to false before returning
        this.isLoading = false;
        return;
      }

      // Skip fetch if data is fresh and not forced
      if (
        !shouldFetchFromGithub &&
        !this.isStale(currentBranch.value) &&
        this.structures[currentBranch.value]?.navigation.length > 0
      ) {
        // Set loading state to false before returning
        this.isLoading = false;
        return;
      }

      try {
        console.log("Fetching navigation from GitHub");
        // Fetch the navigation.json from GitHub
        const jsonContent = await getRawContent(
          config.public.githubOwner,
          config.public.githubRepo,
          "content/_navigation/navigation.json",
          currentBranch.value
        );

        // Parse and validate the JSON data
        const data = JSON.parse(jsonContent) as NavigationData;
        if (!data.navigation || !Array.isArray(data.navigation)) {
          throw new Error("Invalid navigation data structure");
        }

        // If we have a draft and it's within the CDN cache period, keep using it
        const shouldKeepDraft = draftData && this.lastCommitTime && (
          new Date().getTime() - new Date(this.lastCommitTime).getTime() < 6 * 60 * 1000 // 6 minutes
        );
        
        if (shouldKeepDraft) {
          console.log("Using draft navigation structure (within cache period)");
          this.structures[currentBranch.value] = {
            navigation: draftData.navigation,
            lastFetched: new Date().toISOString(),
            branch: currentBranch.value,
            lastGithubFetch: new Date().toISOString(), // Update GitHub fetch time
          };
        } else {
          // Clear any draft if we're using GitHub data
          if (draftData) {
            console.log("Clearing draft navigation structure");
            sidebarEditorStore.clearDraftNavigationStructure();
          }
          
          // Update store with GitHub data
          console.log("Using GitHub navigation structure");
          this.structures[currentBranch.value] = {
            navigation: data.navigation,
            lastFetched: new Date().toISOString(),
            branch: currentBranch.value,
            lastGithubFetch: new Date().toISOString(), // Update GitHub fetch time
          };
        }

        // Save to localStorage
        saveToLocalStorage(this.structures);
      } catch (e) {
        console.error("Error loading navigation structure:", e);
        this.error = e instanceof Error ? e.message : "Failed to load navigation";
        showToast({
          title: "Error",
          message: "Failed to load navigation structure", // Changed from description to message
          type: "error",
        });
      } finally {
        this.isLoading = false;
      }
    },

    setBranch(branch: string) {
      this.currentBranch = branch;
      this.fetchNavigation(true); // Force fetch when changing branch
    },

    addFile(path: string, title: string) {
      console.log("Input path:", path); // Debug log

      const pathParts = path.replace(/^content\/|\.md$/g, "").split("/");
      const fileName = pathParts.pop() || "";
      const parentPath = "/" + pathParts.join("/");

      const newFile: FileItem = {
        title: title || fileName,
        path: "/" + pathParts.join("/") + "/" + fileName,
        type: "file",
        locked: false,
      };

      // Find the parent directory to add the file
      const addToParent = (items: NavigationItem[]): boolean => {
        for (const item of items) {
          if (item.type === "directory" && item.path === parentPath) {
            if (!item.children) item.children = [];
            item.children.push(newFile);
            // Sort children alphabetically
            item.children.sort((a, b) => {
              if (a.type === "directory" && b.type === "file") return -1;
              if (a.type === "file" && b.type === "directory") return 1;
              return a.title.localeCompare(b.title);
            });
            return true;
          }
          if (item.type === "directory" && item.children) {
            if (addToParent(item.children)) return true;
          }
        }
        return false;
      };

      // If parent path is root, add directly to structure
      if (parentPath === "/") {
        const currentStructure =
          this.structures[this.currentBranch]?.navigation || [];
        currentStructure.push(newFile);
        currentStructure.sort((a, b) => {
          if (a.type === "directory" && b.type === "file") return -1;
          if (a.type === "file" && b.type === "directory") return 1;
          return a.title.localeCompare(b.title);
        });
        if (this.structures[this.currentBranch]) {
          this.structures[this.currentBranch].navigation = currentStructure;
        }
      } else {
        const currentStructure =
          this.structures[this.currentBranch]?.navigation || [];
        addToParent(currentStructure);
      }

      // Save to localStorage
      saveToLocalStorage(this.structures);
    },

    addFolder(path: string, title: string) {
      const pathParts = path.replace(/^content\//, "").split("/");
      const folderName = pathParts.pop() || "";
      const parentPath = "/" + pathParts.join("/");

      const newFolder: DirectoryItem = {
        title: title || folderName,
        path: "/" + pathParts.join("/") + "/" + folderName,
        type: "directory",
        locked: false,
        children: [],
      };

      // Helper function to recursively find and update the parent directory
      const addToParent = (items: NavigationItem[]): boolean => {
        for (const item of items) {
          if (item.type === "directory" && item.path === parentPath) {
            if (!item.children) item.children = [];
            item.children.push(newFolder);
            // Sort children alphabetically
            item.children.sort((a, b) => {
              if (a.type === "directory" && b.type === "file") return -1;
              if (a.type === "file" && b.type === "directory") return 1;
              return a.title.localeCompare(b.title);
            });
            return true;
          }
          if (item.type === "directory" && item.children) {
            if (addToParent(item.children)) return true;
          }
        }
        return false;
      };

      // If parent path is root, add directly to the structure
      if (parentPath === "/") {
        const currentStructure =
          this.structures[this.currentBranch]?.navigation || [];
        currentStructure.push(newFolder);
        currentStructure.sort((a, b) => {
          if (a.type === "directory" && b.type === "file") return -1;
          if (a.type === "file" && b.type === "directory") return 1;
          return a.title.localeCompare(b.title);
        });
        if (this.structures[this.currentBranch]) {
          this.structures[this.currentBranch].navigation = currentStructure;
        }
      } else {
        const currentStructure =
          this.structures[this.currentBranch]?.navigation || [];
        if (!addToParent(currentStructure)) {
          console.error("Parent directory not found:", parentPath);
        }
      }

      // Save to localStorage
      saveToLocalStorage(this.structures);

      // Log the updated structure for debugging
      console.log(
        "Updated navigation structure:",
        this.structures[this.currentBranch]
      );
    },

    findItemByPath(path: string): NavigationItem | null {
      const searchItem = (items: NavigationItem[]): NavigationItem | null => {
        for (const item of items) {
          if (item.path === path) {
            return item;
          }
          if (this.isDirectory(item) && item.children) {
            const found = searchItem(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      return searchItem(this.getCurrentStructure);
    },

    findParentItem(path: string): DirectoryItem | null {
      const parentPath = path.split("/").slice(0, -1).join("/");
      const item = this.findItemByPath(parentPath);
      return item && this.isDirectory(item) ? item : null;
    },

    getBreadcrumbs(path: string): NavigationItem[] {
      const breadcrumbs: NavigationItem[] = [];
      const parts = path.split("/").filter(Boolean);
      let currentPath = "";

      for (const part of parts) {
        currentPath += `/${part}`;
        const item = this.findItemByPath(currentPath);
        if (item) {
          breadcrumbs.push(item);
        }
      }

      return breadcrumbs;
    },

    clearStructure(branch: string) {
      if (this.structures[branch]) {
        delete this.structures[branch];
        saveToLocalStorage(this.structures);
      }
    },

    clearAllStructures() {
      this.structures = {};
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("navigation-structure");
        } catch (e) {
          console.warn("Failed to clear navigation from localStorage:", e);
        }
      }
    },

    async updateAfterCommit() {
      await this.fetchNavigation(true);
    },
    
    // New method to force clear local storage and reload from GitHub
    async forceClearAndReload() {
      console.log("Force clearing and reloading navigation");
      
      // First clear all local storage related to navigation
      this.clearAllStructures();
      
      // Also clear any drafts
      if (process.client) {
        const sidebarEditorStore = useSidebarEditorStore();
        sidebarEditorStore.clearDraftNavigationStructure();
        sidebarEditorStore.hasDraftChanges = false;
      }
      
      // Force fetch from GitHub
      await this.fetchNavigation(true);
    }
  },
});