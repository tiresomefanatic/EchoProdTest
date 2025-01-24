<template>
  <div class="content-creator">
    <!-- Create New File Modal -->
    <div v-if="showFileModal" class="modal-overlay">
      <div class="modal">
        <!-- Modal Header -->
        <div class="modal-header">
          <h3>Create New File</h3>
          <button @click="closeModals" class="close-button">×</button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <!-- Folder Selection -->
          <div class="form-group">
            <label>Select Location</label>
            <div class="folder-tree-container">
              <FolderTree
                :items="navigationItems"
                :selectedPath="selectedPath"
                @select="selectFolder"
              />
            </div>
          </div>

          <!-- File Name Input -->
          <div class="form-group">
            <label>File Name</label>
            <input
              v-model="fileName"
              type="text"
              placeholder="e.g., guide.md"
            />
            <small>.md will be added automatically</small>
          </div>

          <!-- Selected Path Display -->
          <div class="selected-path">
            Selected path: {{ selectedPath || "/" }}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button @click="closeModals" class="button secondary">Cancel</button>
          <button
            @click="createFile"
            :disabled="!fileName || isProcessing"
            class="button primary"
          >
            <span v-if="isProcessing" class="loading-spinner"></span>
            <span>{{ isProcessing ? "Creating..." : "Create File" }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Create New Folder Modal -->
    <div v-if="showFolderModal" class="modal-overlay">
      <div class="modal">
        <!-- Modal Header -->
        <div class="modal-header">
          <h3>Create New Folder</h3>
          <button @click="closeModals" class="close-button">×</button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <!-- Folder Selection -->
          <div class="form-group">
            <label>Select Location</label>
            <div class="folder-tree-container">
              <FolderTree
                :items="navigationItems"
                :selectedPath="selectedPath"
                @select="selectFolder"
              />
            </div>
          </div>

          <!-- Folder Name Input -->
          <div class="form-group">
            <label>Folder Name</label>
            <input
              v-model="folderName"
              type="text"
              placeholder="e.g., guides"
            />
          </div>

          <!-- Selected Path Display -->
          <div class="selected-path">
            Selected path: {{ selectedPath || "/" }}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button @click="closeModals" class="button secondary">Cancel</button>
          <button
            @click="createFolder"
            :disabled="!folderName || isProcessing"
            class="button primary"
          >
            <span v-if="isProcessing" class="loading-spinner"></span>
            <span>{{ isProcessing ? "Creating..." : "Create Folder" }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- New Button -->
    <div class="new-button-container">
      <button @click="toggleDropdown" class="button new-button">
        <span>New</span>
        <span class="dropdown-arrow">▼</span>
      </button>

      <!-- Dropdown Menu -->
      <div v-if="isDropdownOpen" class="dropdown-menu">
        <button @click="openFileModal">New File</button>
        <button @click="openFolderModal">New Folder</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useGithub } from "../composables/useGithub";
import { useNavigationStore } from "../store/navigation";
import { useToast } from "../composables/useToast";
import { useRouter } from "vue-router";
import FolderTree from "../components/FolderTree.vue";

import { useRuntimeConfig } from "#app"; // Import runtime config

const emit = defineEmits(["content-created"]);

// Composables
const router = useRouter();
const { createNewContent, saveFileContent, currentBranch } = useGithub();
const navigationStore = useNavigationStore();
const { showToast } = useToast();
const config = useRuntimeConfig();

// State
const isDropdownOpen = ref(false);
const showFileModal = ref(false);
const showFolderModal = ref(false);
const fileName = ref("");
const folderName = ref("");
const selectedPath = ref("/");
const isProcessing = ref(false);

// Computed
const navigationItems = computed(() => {
  const items = navigationStore.getCurrentStructure;
  console.log("Navigation Items:", items); // Debugging
  return Array.isArray(items)
    ? items.filter((item) => item.type === "directory")
    : [];
});

// Methods
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const openFileModal = () => {
  showFileModal.value = true;
  isDropdownOpen.value = false;
};

const openFolderModal = () => {
  showFolderModal.value = true;
  isDropdownOpen.value = false;
};

const closeModals = () => {
  showFileModal.value = false;
  showFolderModal.value = false;
  isDropdownOpen.value = false;
  fileName.value = "";
  folderName.value = "";
  selectedPath.value = "/";
  isProcessing.value = false;
};

const selectFolder = (path: string) => {
  console.log("Selected Path:", path); // Debugging

  selectedPath.value = path;
};

const createFile = async () => {
  if (!fileName.value || isProcessing.value) return;

  isProcessing.value = true;
  try {
    const path = fileName.value.endsWith(".md")
      ? fileName.value
      : `${fileName.value}.md`;
    const fullPath = `content${
      selectedPath.value === "/" ? "/" : selectedPath.value + "/"
    }${path}`;

    // Normalize the path for navigation.json (ensure it starts with "/")
    const normalizedPath = `/${fullPath.replace(/^content\//, "")}`;

    // First update the store for immediate UI feedback
    navigationStore.addFile(fullPath, fileName.value);

    // Then try to create the file on GitHub
    await createNewContent(fullPath.replace(/\/+/g, "/"), "", false);

    // Fetch the current navigation.json file from GitHub (raw request)
    const navigationJsonPath = "content/_navigation/navigation.json";
    const navigationJsonUrl = `https://raw.githubusercontent.com/${config.public.githubOwner}/${config.public.githubRepo}/${currentBranch.value}/${navigationJsonPath}`;
    const response = await fetch(navigationJsonUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch navigation.json: ${response.statusText}`
      );
    }

    const navigationJsonContent = await response.text();

    // Parse the navigation.json content
    const navigationData = JSON.parse(navigationJsonContent) as NavigationData;

    // Add the new file to the navigation data
    const newFile: FileItem = {
      title: fileName.value,
      path: normalizedPath, // Use normalized path with leading "/"
      type: "file",
      locked: false,
    };

    // Find the parent directory in the navigation data and add the new file
    const addToParent = (items: NavigationItem[]): boolean => {
      for (const item of items) {
        if (item.type === "directory" && item.path === selectedPath.value) {
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

    addToParent(navigationData.navigation);

    // Save the updated navigation.json back to GitHub
    await saveFileContent(
      config.public.githubOwner,
      config.public.githubRepo,
      navigationJsonPath,
      JSON.stringify(navigationData, null, 2),
      `Update navigation.json to reflect new file: ${fullPath}`,
      currentBranch.value
    );

    // If successful, refresh the navigation data
    await navigationStore.updateAfterCommit();

    showToast({
      title: "Success",
      message: "File created successfully",
      type: "success",
    });

    emit("content-created");
    closeModals();

    // Navigate to the new file
    const newPath = fullPath.replace(/^content\/|\.md$/g, "");
    await router.push(`/${newPath}`);
  } catch (error) {
    console.error("Error creating file:", error);
    // If failed, refresh navigation to revert changes
    await navigationStore.fetchNavigation(true);
    showToast({
      title: "Error",
      message: "Failed to create file",
      type: "error",
    });
  } finally {
    isProcessing.value = false;
  }
};

const createFolder = async () => {
  if (!folderName.value || isProcessing.value) return;

  isProcessing.value = true;
  try {
    const fullPath = `content${
      selectedPath.value === "/" ? "/" : selectedPath.value + "/"
    }${folderName.value}`;

    // Normalize the path for navigation.json (ensure it starts with "/")
    const normalizedPath = `/${fullPath.replace(/^content\//, "")}`;

    // First update the store for immediate UI feedback
    navigationStore.addFolder(fullPath, folderName.value);

    // Then try to create the folder on GitHub
    await createNewContent(fullPath.replace(/\/+/g, "/"), "", true);

    // Fetch the current navigation.json file from GitHub (raw request)
    const navigationJsonPath = "content/_navigation/navigation.json";
    const navigationJsonUrl = `https://raw.githubusercontent.com/${config.public.githubOwner}/${config.public.githubRepo}/${currentBranch.value}/${navigationJsonPath}`;
    const response = await fetch(navigationJsonUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch navigation.json: ${response.statusText}`
      );
    }

    const navigationJsonContent = await response.text();

    // Parse the navigation.json content
    const navigationData = JSON.parse(navigationJsonContent) as NavigationData;

    // Add the new folder to the navigation data
    const newFolder: DirectoryItem = {
      title: folderName.value,
      path: normalizedPath, // Use normalized path with leading "/"
      type: "directory",
      locked: false,
      children: [],
    };

    // Find the parent directory in the navigation data and add the new folder
    const addToParent = (items: NavigationItem[]): boolean => {
      for (const item of items) {
        if (item.type === "directory" && item.path === selectedPath.value) {
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

    addToParent(navigationData.navigation);

    // Save the updated navigation.json back to GitHub
    await saveFileContent(
      config.public.githubOwner,
      config.public.githubRepo,
      navigationJsonPath,
      JSON.stringify(navigationData, null, 2),
      `Update navigation.json to reflect new folder: ${fullPath}`,
      currentBranch.value
    );

    // If successful, refresh the navigation data
    await navigationStore.updateAfterCommit();

    showToast({
      title: "Success",
      message: "Folder created successfully",
      type: "success",
    });

    emit("content-created");
    closeModals();
  } catch (error) {
    console.error("Error creating folder:", error);
    // If failed, refresh navigation to revert changes
    await navigationStore.fetchNavigation(true);
    showToast({
      title: "Error",
      message: "Failed to create folder",
      type: "error",
    });
  } finally {
    isProcessing.value = false;
  }
};

// Keyboard event handler
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeModals();
  }
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
.content-creator {
  position: relative;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  margin: 0 16px;
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-body {
  padding: 16px;
  color: #000; /* Ensure text color is black */
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
}

.close-button:hover {
  color: #111827;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #000; /* Ensure label text is black */
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  color: white; /* Ensure input text is black */
}

.form-group input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-group small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.folder-tree-container {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
  background: #f9fafb;
}

.selected-path {
  margin-top: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 14px;
  color: #000; /* Ensure selected path text is black */
}

.button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.button.primary {
  background: #2563eb;
  color: white;
  border: none;
}

.button.primary:hover {
  background: #1d4ed8;
}

.button.primary:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.button.secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.button.secondary:hover {
  background: #f9fafb;
}

.new-button {
  background: #22c55e;
  color: white;
  border: none;
  position: relative;
}

.new-button:hover {
  background: #16a34a;
}

.new-button .dropdown-arrow {
  font-size: 12px;
  margin-left: 4px;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  z-index: 50;
}

.dropdown-menu button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 16px;
  border: none;
  background: none;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.dropdown-menu button:hover {
  background: #f3f4f6;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Focus styles */
.button:focus,
.form-group input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Transition effects */
.modal-overlay {
  transition: opacity 0.2s ease-in-out;
}

.modal {
  transition: transform 0.2s ease-in-out;
}

.dropdown-menu,
.folder-tree-container {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Outside click handler styles */
.new-button-container {
  position: relative;
  display: inline-block;
}

/* Responsive styles */
@media (max-width: 640px) {
  .modal {
    margin: 16px;
    width: calc(100% - 32px);
  }

  .button {
    padding: 8px 12px;
    font-size: 13px;
  }

  .folder-tree-container {
    max-height: 160px;
  }

  .modal-header h3 {
    font-size: 16px;
  }

  .dropdown-menu {
    width: 140px;
  }
}
</style>
