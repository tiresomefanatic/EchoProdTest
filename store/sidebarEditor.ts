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
}

export const useSidebarEditorStore = defineStore("sidebarEditor", {
  state: (): SidebarEditorState => ({
    isEditMode: false,
    showNewFileModal: false,
    showNewFolderModal: false,
    newItemParentPath: null,
    newItemName: "",
  }),

  actions: {
    toggleEditMode() {
      this.isEditMode = !this.isEditMode;
      // Reset state when exiting edit mode
      if (!this.isEditMode) {
        this.resetState();
      }
    },

    resetState() {
      this.showNewFileModal = false;
      this.showNewFolderModal = false;
      this.newItemParentPath = null;
      this.newItemName = "";
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

    // Create a new file in the navigation structure
    async createNewFile() {
      if (!this.newItemParentPath || !this.newItemName) return;
      
      const navigationStore = useNavigationStore();
      const { currentBranch, saveFileContent, createNewContent } = useGithub();
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
        
        // Fetch the current navigation.json
        const navigationJsonPath = "content/_navigation/navigation.json";
        const navigationJsonUrl = `https://raw.githubusercontent.com/${config.public.githubOwner}/${config.public.githubRepo}/${currentBranch.value}/${navigationJsonPath}`;
        const response = await fetch(navigationJsonUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch navigation.json: ${response.statusText}`);
        }
        
        const navigationJsonContent = await response.text();
        const navigationData = JSON.parse(navigationJsonContent);
        
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
        
        // Save the updated navigation.json
        await saveFileContent(
          config.public.githubOwner,
          config.public.githubRepo,
          navigationJsonPath,
          JSON.stringify(navigationData, null, 2),
          `Add new file: ${normalizedFileName}`,
          currentBranch.value
        );
        
        // Update the navigation store
        await navigationStore.updateAfterCommit();
        
        showToast({
          title: "Success",
          message: "New file created successfully",
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
    
    // Create a new folder in the navigation structure
    async createNewFolder() {
      if (!this.newItemParentPath || !this.newItemName) return;
      
      const navigationStore = useNavigationStore();
      const { currentBranch, saveFileContent, createNewContent } = useGithub();
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
        
        // Fetch the current navigation.json
        const navigationJsonPath = "content/_navigation/navigation.json";
        const navigationJsonUrl = `https://raw.githubusercontent.com/${config.public.githubOwner}/${config.public.githubRepo}/${currentBranch.value}/${navigationJsonPath}`;
        const response = await fetch(navigationJsonUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch navigation.json: ${response.statusText}`);
        }
        
        const navigationJsonContent = await response.text();
        const navigationData = JSON.parse(navigationJsonContent);
        
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
        
        // Save the updated navigation.json
        await saveFileContent(
          config.public.githubOwner,
          config.public.githubRepo,
          navigationJsonPath,
          JSON.stringify(navigationData, null, 2),
          `Add new folder: ${normalizedFolderName}`,
          currentBranch.value
        );
        
        // Update the navigation store
        await navigationStore.updateAfterCommit();
        
        showToast({
          title: "Success",
          message: "New folder created successfully",
          type: "success",
        });
        
        // Reset state
        this.closeModals();
      } catch (error) {
        console.error("Error creating new folder:", error);
        showToast({
          title: "Error",
          message: `Failed to create folder: ${error.message}`,
          type: "error",
        });
      }
    },
    
    // Move an item up in the same parent
    async moveItemUp(itemPath: string) {
      const navigationStore = useNavigationStore();
      const { currentBranch, saveFileContent } = useGithub();
      const { showToast } = useToast();
      const config = useRuntimeConfig();
      
      try {
        // Fetch the current navigation.json
        const navigationJsonPath = "content/_navigation/navigation.json";
        const navigationJsonUrl = `https://raw.githubusercontent.com/${config.public.githubOwner}/${config.public.githubRepo}/${currentBranch.value}/${navigationJsonPath}`;
        const response = await fetch(navigationJsonUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch navigation.json: ${response.statusText}`);
        }
        
        const navigationJsonContent = await response.text();
        const navigationData = JSON.parse(navigationJsonContent);
        
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
        
        // Save the updated navigation.json
        await saveFileContent(
          config.public.githubOwner,
          config.public.githubRepo,
          navigationJsonPath,
          JSON.stringify(navigationData, null, 2),
          `Move item up: ${itemPath}`,
          currentBranch.value
        );
        
        // Update the navigation store
        await navigationStore.updateAfterCommit();
        
        showToast({
          title: "Success",
          message: "Item moved up successfully",
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
    
    // Move an item down in the same parent
    async moveItemDown(itemPath: string) {
      const navigationStore = useNavigationStore();
      const { currentBranch, saveFileContent } = useGithub();
      const { showToast } = useToast();
      const config = useRuntimeConfig();
      
      try {
        // Fetch the current navigation.json
        const navigationJsonPath = "content/_navigation/navigation.json";
        const navigationJsonUrl = `https://raw.githubusercontent.com/${config.public.githubOwner}/${config.public.githubRepo}/${currentBranch.value}/${navigationJsonPath}`;
        const response = await fetch(navigationJsonUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch navigation.json: ${response.statusText}`);
        }
        
        const navigationJsonContent = await response.text();
        const navigationData = JSON.parse(navigationJsonContent);
        
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
        
        // Save the updated navigation.json
        await saveFileContent(
          config.public.githubOwner,
          config.public.githubRepo,
          navigationJsonPath,
          JSON.stringify(navigationData, null, 2),
          `Move item down: ${itemPath}`,
          currentBranch.value
        );
        
        // Update the navigation store
        await navigationStore.updateAfterCommit();
        
        showToast({
          title: "Success",
          message: "Item moved down successfully",
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
    }
  }
}); 