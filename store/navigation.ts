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
}

interface NavigationState {
  structures: Record<string, NavigationStructure>;
  currentBranch: string;
  isLoading: boolean;
  error: string | null;
  lastCommitTime: string | null; // Track when changes were committed
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
    currentBranch: "main",
    isLoading: false,
    error: null,
    lastCommitTime: null,
  }),

  getters: {
    getCurrentStructure: (state) => {
      return state.structures[state.currentBranch]?.navigation || [];
    },

    isStale: (state) => (branch: string) => {
      const structure = state.structures[branch];
      if (!structure?.lastFetched) return true;

      // Consider data stale after 1 hour
      const staleTime = 60 * 60 * 1000;
      const now = new Date().getTime();
      const lastFetch = new Date(structure.lastFetched).getTime();

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
      
      // Use direct import instead of require
      const sidebarEditorStore = useSidebarEditorStore();
      const draftData = sidebarEditorStore.getDraftNavigationStructure();
      
      // Use draft if it exists and we're not forcing a fetch
      if (draftData && !forceFetch) {
        this.structures[currentBranch.value] = {
          navigation: draftData.navigation,
          lastFetched: new Date().toISOString(),
          branch: currentBranch.value,
        };
        
        // Save to localStorage
        saveToLocalStorage(this.structures);
        return;
      }

      // Skip fetch if data is fresh and not forced
      if (
        !forceFetch &&
        !this.isStale(currentBranch.value) &&
        this.structures[currentBranch.value]?.navigation.length > 0
      ) {
        return;
      }

      this.isLoading = true;
      this.error = null;

      try {
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
        if (draftData && this.lastCommitTime) {
          const cacheTime = 5 * 60 * 1000; // 5 minutes in milliseconds
          const now = new Date().getTime();
          const commitTime = new Date(this.lastCommitTime).getTime();
          if (now - commitTime < cacheTime) {
            this.structures[currentBranch.value] = {
              navigation: draftData.navigation,
              lastFetched: new Date().toISOString(),
              branch: currentBranch.value,
            };
            saveToLocalStorage(this.structures);
            this.isLoading = false;
            return;
          } else {
            // If cache period has passed, clear the draft
            sidebarEditorStore.clearDraftNavigationStructure();
          }
        }

        // Update store
        this.structures[currentBranch.value] = {
          navigation: data.navigation,
          lastFetched: new Date().toISOString(),
          branch: currentBranch.value,
        };

        // Save to localStorage
        saveToLocalStorage(this.structures);
      } catch (e) {
        console.error("Error loading navigation structure:", e);
        this.error =
          e instanceof Error ? e.message : "Failed to load navigation";
        showToast({
          title: "Error",
          description: "Failed to load navigation structure",
          type: "error",
        });
      } finally {
        this.isLoading = false;
      }
    },

    setBranch(branch: string) {
      this.currentBranch = branch;
      this.fetchNavigation(false);
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
  },
});