import { defineStore } from "pinia";
import { useNavigationStore } from "./navigation";
import { useGithub } from "~/composables/useGithub";
import { useToast } from "~/composables/useToast";
import { useRuntimeConfig } from "#app";

// Define state interface
interface SidebarEditorState {
  isEditMode: boolean;
  showNewFileModal: boolean;
  showNewFolderModal: boolean;
  newItemParentPath: string | null;
  newItemName: string;
  hasDraftChanges: boolean; // Track if we have unsaved navigation changes
  previousBranch: string; // Track the current branch for change detection
}

export const useSidebarEditorStore = defineStore("sidebarEditor", {
  state: (): SidebarEditorState => ({
    isEditMode: false,
    showNewFileModal: false,
    showNewFolderModal: false,
    newItemParentPath: null,
    newItemName: "",
    hasDraftChanges: false,
    previousBranch: process.client ? localStorage.getItem("github-current-branch") || "main" : "main",
  }),

  actions: {
    toggleEditMode() {
      this.isEditMode = !this.isEditMode;
      // Reset state when exiting edit mode
      if (!this.isEditMode) {
        this.resetState();
      }
    },
    
    // Force exit edit mode (used during branch changes)
    exitEditMode() {
      if (this.isEditMode) {
        this.isEditMode = false;
        this.resetState();
      }
    },
    
    // Monitor branch changes and exit edit mode when branch changes
    monitorBranchChanges() {
      if (process.client) {
        // Check for direct clear signal set by switchBranch
        const shouldClearDrafts = localStorage.getItem("clear-navigation-drafts") === "true";
        if (shouldClearDrafts) {
          console.log("Detected clear-navigation-drafts signal, clearing drafts");
          this.clearDraftNavigationStructure();
          this.hasDraftChanges = false;
          localStorage.removeItem("clear-navigation-drafts");
        }

        // Check for branch changes
        const currentBranch = localStorage.getItem("github-current-branch") || "main";
        if (currentBranch !== this.previousBranch) {
          console.log(`Branch changed from ${this.previousBranch} to ${currentBranch}, exiting edit mode`);
          // Exit edit mode
          this.exitEditMode();
          // Clear any draft changes to remove the Commit Changes button
          this.clearDraftNavigationStructure();
          this.hasDraftChanges = false;
          // Update tracked branch
          this.previousBranch = currentBranch;
        }
      }
    },

    resetState() {
      this.showNewFileModal = false;
      this.showNewFolderModal = false;
      this.newItemParentPath = null;
      this.newItemName = "";
    },

    // Draft navigation structure management
    saveDraftNavigationStructure(navigationData: any) {
      if (process.client) {
        const currentBranch = localStorage.getItem("github-current-branch") || "main";
        localStorage.setItem(`navigation-draft-${currentBranch}`, JSON.stringify(navigationData));
        this.hasDraftChanges = true;
      }
    },

    getDraftNavigationStructure() {
      if (!process.client) return null;
      const currentBranch = localStorage.getItem("github-current-branch") || "main";
      const draft = localStorage.getItem(`navigation-draft-${currentBranch}`);
      return draft ? JSON.parse(draft) : null;
    },

    clearDraftNavigationStructure() {
      if (process.client) {
        const currentBranch = localStorage.getItem("github-current-branch") || "main";
        localStorage.removeItem(`navigation-draft-${currentBranch}`);
        this.hasDraftChanges = false;
      }
    },

    // Open modal for creating a new file
    openNewFileModal(parentPath: string) {
      this.showNewFileModal = true;
      this.newItemParentPath = parentPath;
      this.newItemName = "";
    },

    // Open modal for creating a new folder
    openNewFolderModal(parentPath: string) {
      this.showNewFolderModal = true;
      this.newItemParentPath = parentPath;
      this.newItemName = "";
    },

    // Close all modals
    closeModals() {
      this.showNewFileModal = false;
      this.showNewFolderModal = false;
      this.newItemParentPath = null;
      this.newItemName = "";
    },

    // Create a new file in the navigation structure - updated to use draft system
    async createNewFile() {
      if (!this.newItemParentPath || !this.newItemName) return;
      
      const navigationStore = useNavigationStore();
      const { currentBranch, createNewContent } = useGithub();
      const { showToast } = useToast();
      const config = useRuntimeConfig();
      
      try {
        // Normalize the file name
        const normalizedFileName = this.newItemName
          .trim()
          .replace(/\.md$/, "")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .replace(/\s+/g, "-")
          .toLowerCase();
        
        // Generate the full file path
        const fullPath = `content${
          this.newItemParentPath === "/" ? "/" : this.newItemParentPath + "/"
        }${normalizedFileName}.md`;
        
        // Normalize the path for navigation.json
        const normalizedPath = `/${fullPath.replace(/^content\/|\.md$/g, "")}`;
        
        // Create the empty file on GitHub
        await createNewContent(fullPath.replace(/\/+/g, "/"), "", false);
        
        // Get current navigation structure (either from draft or GitHub)
        let navigationData;
        const existingDraft = this.getDraftNavigationStructure();
        
        if (existingDraft) {
          navigationData = existingDraft;
        } else {
          // Fetch the current navigation.json from GitHub
          const navigationJsonPath = "content/_navigation/navigation.json";
          const navigationJsonUrl = `https://raw.githubusercontent.com/${config.public.githubOwner}/${config.public.githubRepo}/${currentBranch.value}/${navigationJsonPath}`;
          const response = await fetch(navigationJsonUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch navigation.json: ${response.statusText}`);
          }
          
          const navigationJsonContent = await response.text();
          navigationData = JSON.parse(navigationJsonContent);
        }
        
        // Create the new file entry
        const newFile = {
          title: this.newItemName.trim(),
          path: normalizedPath,
          type: "file",
          locked: false,
        };
        
        // Helper function to add the file to the correct parent
        const addToParent = (items) => {
          for (const item of items) {
            if (item.type === "directory" && item.path === this.newItemParentPath) {
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
        
        // If parent path is root, add directly to navigation array
        if (this.newItemParentPath === "/") {
          navigationData.navigation.push(newFile);
          navigationData.navigation.sort((a, b) => {
            if (a.type === "directory" && b.type === "file") return -1;
            if (a.type === "file" && b.type === "directory") return 1;
            return a.title.localeCompare(b.title);
          });
        } else {
          addToParent(navigationData.navigation);
        }
        
        // Save to draft instead of immediately committing
        this.saveDraftNavigationStructure(navigationData);
        
        // Update the navigation store to use the draft
        navigationStore.applyDraft(navigationData);
        
        showToast({
          title: "Success",
          message: "New file created (draft saved)",
          type: "success",
        });
        
        // Reset state
        this.closeModals();
      } catch (error) {
        console.error("Error creating new file:", error);
        showToast({
          title: "Error",
          message: `Failed to create file: ${error.message}`,
          type: "error",
        });
      }
    },
    
    // Create a new folder in the navigation structure - updated to use draft system
    async createNewFolder() {
      if (!this.newItemParentPath || !this.newItemName) return;
      
      const navigationStore = useNavigationStore();
      const { currentBranch, createNewContent } = useGithub();
      const { showToast } = useToast();
      const config = useRuntimeConfig();
      
      try {
        // Normalize the folder name
        const normalizedFolderName = this.newItemName
          .trim()
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .replace(/\s+/g, "-")
          .toLowerCase();
        
        // Generate the full folder path
        const fullPath = `content${
          this.newItemParentPath === "/" ? "/" : this.newItemParentPath + "/"
        }${normalizedFolderName}`;
        
        // Normalize the path for navigation.json
        const normalizedPath = `/${fullPath.replace(/^content\//g, "")}`;
        
        // Create a .gitkeep file in the new folder on GitHub
        await createNewContent(fullPath.replace(/\/+/g, "/"), "", true);
        
        // Get current navigation structure (either from draft or GitHub)
        let navigationData;
        const existingDraft = this.getDraftNavigationStructure();
        
        if (existingDraft) {
          navigationData = existingDraft;
        } else {
          // Fetch the current navigation.json
          const navigationJsonPath = "content/_navigation/navigation.json";
          const navigationJsonUrl = `https://raw.githubusercontent.com/${config.public.githubOwner}/${config.public.githubRepo}/${currentBranch.value}/${navigationJsonPath}`;
          const response = await fetch(navigationJsonUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch navigation.json: ${response.statusText}`);
          }
          
          const navigationJsonContent = await response.text();
          navigationData = JSON.parse(navigationJsonContent);
        }
        
        // Create the new folder entry
        const newFolder = {
          title: this.newItemName.trim(),
          path: normalizedPath,
          type: "directory",
          locked: false,
          children: [],
        };
        
        // Helper function to add the folder to the correct parent
        const addToParent = (items) => {
          for (const item of items) {
            if (item.type === "directory" && item.path === this.newItemParentPath) {
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
        
        // If parent path is root, add directly to navigation array
        if (this.newItemParentPath === "/") {
          navigationData.navigation.push(newFolder);
          navigationData.navigation.sort((a, b) => {
            if (a.type === "directory" && b.type === "file") return -1;
            if (a.type === "file" && b.type === "directory") return 1;
            return a.title.localeCompare(b.title);
          });
        } else {
          addToParent(navigationData.navigation);
        }
        
        // Save to draft instead of immediately committing
        this.saveDraftNavigationStructure(navigationData);
        
        // Update the navigation store to use the draft
        navigationStore.applyDraft(navigationData);
        
        showToast({
          title: "Success",
          message: "New category created (draft saved)",
          type: "success",
        });
        
        // Reset state
        this.closeModals();
      } catch (error) {
        console.error("Error creating new folder:", error);
        showToast({
          title: "Error",
          message: `Failed to create category: ${error.message}`,
          type: "error",
        });
      }
    },
    
    // Move an item up in the same parent - updated to use draft
    async moveItemUp(itemPath: string) {
      const navigationStore = useNavigationStore();
      const { currentBranch } = useGithub();
      const { showToast } = useToast();
      const config = useRuntimeConfig();
      
      try {
        // Get the current navigation structure
        let navigationData;
        
        // First check if we already have a draft
        const existingDraft = this.getDraftNavigationStructure();
        
        if (existingDraft) {
          navigationData = existingDraft;
        } else {
          // Otherwise fetch from GitHub
          const navigationJsonPath = "content/_navigation/navigation.json";
          const navigationJsonUrl = `https://raw.githubusercontent.com/${config.public.githubOwner}/${config.public.githubRepo}/${currentBranch.value}/${navigationJsonPath}`;
          const response = await fetch(navigationJsonUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch navigation.json: ${response.statusText}`);
          }
          
          const navigationJsonContent = await response.text();
          navigationData = JSON.parse(navigationJsonContent);
        }
        
        // Find the item and its parent
        let parentCollection = null;
        let foundItem = null;
        let itemIndex = -1;
        
        const findItem = (items, parent = null) => {
          for (let i = 0; i < items.length; i++) {
            if (items[i].path === itemPath) {
              parentCollection = parent || items;
              foundItem = items[i];
              itemIndex = i;
              return true;
            }
            if (items[i].type === "directory" && items[i].children) {
              if (findItem(items[i].children, items[i].children)) {
                return true;
              }
            }
          }
          return false;
        };
        
        findItem(navigationData.navigation);
        
        if (!foundItem || !parentCollection || itemIndex === -1) {
          throw new Error("Item not found in navigation structure");
        }
        
        // Can't move up if it's already at the top
        if (itemIndex === 0) {
          showToast({
            title: "Info",
            message: "Item is already at the top",
            type: "info",
          });
          return;
        }
        
        // Get the item above
        const itemAbove = parentCollection[itemIndex - 1];
        
        // If they have the same type or moving a directory, simple swap
        if (foundItem.type === itemAbove.type || foundItem.type === "directory") {
          // Swap the items
          parentCollection[itemIndex] = itemAbove;
          parentCollection[itemIndex - 1] = foundItem;
        } else {
          // Moving a file above a directory - find the appropriate position
          // Remove the item from its current position
          parentCollection.splice(itemIndex, 1);
          
          // Find the index of the last directory in the collection
          let lastDirIndex = -1;
          for (let i = 0; i < parentCollection.length; i++) {
            if (parentCollection[i].type === "directory") {
              lastDirIndex = i;
            } else {
              break;
            }
          }
          
          // Insert after the last directory
          parentCollection.splice(lastDirIndex + 1, 0, foundItem);
        }
        
        // Save to draft instead of committing to GitHub
        this.saveDraftNavigationStructure(navigationData);
        
        // Update the navigation store to use the draft
        navigationStore.applyDraft(navigationData);
        
        showToast({
          title: "Success",
          message: "Item moved up successfully (draft saved)",
          type: "success",
        });
      } catch (error) {
        console.error("Error moving item up:", error);
        showToast({
          title: "Error",
          message: `Failed to move item: ${error.message}`,
          type: "error",
        });
      }
    },
    
    // Move an item down in the same parent - updated to use draft
    async moveItemDown(itemPath: string) {
      const navigationStore = useNavigationStore();
      const { currentBranch } = useGithub();
      const { showToast } = useToast();
      const config = useRuntimeConfig();
      
      try {
        // Get the current navigation structure
        let navigationData;
        
        // First check if we already have a draft
        const existingDraft = this.getDraftNavigationStructure();
        
        if (existingDraft) {
          navigationData = existingDraft;
        } else {
          // Otherwise fetch from GitHub
          const navigationJsonPath = "content/_navigation/navigation.json";
          const navigationJsonUrl = `https://raw.githubusercontent.com/${config.public.githubOwner}/${config.public.githubRepo}/${currentBranch.value}/${navigationJsonPath}`;
          const response = await fetch(navigationJsonUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch navigation.json: ${response.statusText}`);
          }
          
          const navigationJsonContent = await response.text();
          navigationData = JSON.parse(navigationJsonContent);
        }
        
        // Find the item and its parent
        let parentCollection = null;
        let foundItem = null;
        let itemIndex = -1;
        
        const findItem = (items, parent = null) => {
          for (let i = 0; i < items.length; i++) {
            if (items[i].path === itemPath) {
              parentCollection = parent || items;
              foundItem = items[i];
              itemIndex = i;
              return true;
            }
            if (items[i].type === "directory" && items[i].children) {
              if (findItem(items[i].children, items[i].children)) {
                return true;
              }
            }
          }
          return false;
        };
        
        findItem(navigationData.navigation);
        
        if (!foundItem || !parentCollection || itemIndex === -1) {
          throw new Error("Item not found in navigation structure");
        }
        
        // Can't move down if it's already at the bottom
        if (itemIndex === parentCollection.length - 1) {
          showToast({
            title: "Info",
            message: "Item is already at the bottom",
            type: "info",
          });
          return;
        }
        
        // Get the item below
        const itemBelow = parentCollection[itemIndex + 1];
        
        // If they have the same type or moving a file, simple swap
        if (foundItem.type === itemBelow.type || foundItem.type === "file") {
          // Swap the items
          parentCollection[itemIndex] = itemBelow;
          parentCollection[itemIndex + 1] = foundItem;
        } else {
          // Moving a directory below a file - find the appropriate position
          // Remove the item from its current position
          parentCollection.splice(itemIndex, 1);
          
          // Find the index of the first file in the collection
          let firstFileIndex = parentCollection.length;
          for (let i = 0; i < parentCollection.length; i++) {
            if (parentCollection[i].type === "file") {
              firstFileIndex = i;
              break;
            }
          }
          
          // Insert before the first file
          parentCollection.splice(firstFileIndex - 1, 0, foundItem);
        }
        
        // Save to draft instead of committing to GitHub
        this.saveDraftNavigationStructure(navigationData);
        
        // Update the navigation store to use the draft
        navigationStore.applyDraft(navigationData);
        
        showToast({
          title: "Success",
          message: "Item moved down successfully (draft saved)",
          type: "success",
        });
      } catch (error) {
        console.error("Error moving item down:", error);
        showToast({
          title: "Error",
          message: `Failed to move item: ${error.message}`,
          type: "error",
        });
      }
    },

    // New method to commit draft changes to GitHub
    async commitNavigationChanges() {
      const navigationStore = useNavigationStore();
      const { currentBranch, saveFileContent } = useGithub();
      const { showToast } = useToast();
      const config = useRuntimeConfig();
      
      try {
        // Get the current draft
        const draftData = this.getDraftNavigationStructure();
        
        if (!draftData) {
          showToast({
            title: "Info",
            message: "No changes to commit",
            type: "info",
          });
          return;
        }
        
        // Save to GitHub
        const navigationJsonPath = "content/_navigation/navigation.json";
        await saveFileContent(
          config.public.githubOwner,
          config.public.githubRepo,
          navigationJsonPath,
          JSON.stringify(draftData, null, 2),
          `Update navigation structure`,
          currentBranch.value
        );
        
        // Update the navigation store but keep using the draft until cache refresh
        navigationStore.updateLastCommitTime();
        
        showToast({
          title: "Success",
          message: "Navigation changes committed successfully",
          type: "success",
        });
        
        // Note: We don't clear the draft here to avoid UI jumping due to GitHub's CDN cache
      } catch (error) {
        console.error("Error committing navigation changes:", error);
        showToast({
          title: "Error",
          message: `Failed to commit changes: ${error.message}`,
          type: "error",
        });
      }
    }
  }
});