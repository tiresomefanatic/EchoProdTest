# [...slug].vue
<template>
  <div class="page-wrapper">
    <ClientOnly>
      <div>
        <Header />
        <div class="content-area" :class="{ 'editing-mode': isEditing }">
          <!-- Mobile menu wrapper -->
          <div class="mobile-menu-wrapper md:hidden">
            <DesignSidebar />
          </div>

          <!-- Desktop sidebar shown only in non-editing mode -->
          <aside
            v-if="!isEditing && showSidebar"
            class="sidebar hidden md:block fixed top-[60px] left-0 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto"
          >
            <DesignSidebar />
          </aside>

          <div class="main-content flex-1">
            <!-- Content header with edit controls - only show when logged in -->
            <div
              v-if="isLoggedIn"
              class="content-header fixed top-[76px] right-6 z-10 flex items-center gap-3"
            >
              <ClientOnly>
                <div v-if="branches.length > 0" class="branch-select-wrapper">
                  <select
                    v-model="currentBranch"
                    @change="handleBranchChange"
                    class="branch-select px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option
                      v-for="branch in branches"
                      :key="branch"
                      :value="branch"
                    >
                      {{ branch }}
                    </option>
                  </select>
                </div>
                <button
                  v-if="!isEditing"
                  @click="handleEditClick"
                  class="edit-button px-4 py-2 bg-[#0969DA] text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  v-else
                  @click="exitEditor"
                  class="edit-button px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Exit
                </button>
                <ContentCreator
                  v-if="isLoggedIn"
                  @content-created="handleContentCreated"
                />
              </ClientOnly>
            </div>

            <!-- Main content area -->
            <ClientOnly>
              <div v-if="isEditing" class="editor-container mt-4">
                <TiptapEditor
                  :content="editorContent"
                  :filePath="contentPath"
                  @update:content="handleContentChange"
                  @save="handleSave"
                  @error="handleEditorError"
                />
                <CollaborationSidebar
                  v-if="isLoggedIn"
                  :filePath="contentPath"
                  class="collaboration-sidebar"
                  @load-save="handleLoadSave"
                />
              </div>
              <div v-else class="prose-content max-w-[960px] mx-auto px-6 py-8">
                <div :key="githubContent">
                  <template v-if="!isLoggedIn">
                    <ContentDoc :path="path" :head="false">
                      <template #empty>
                        <p>No content found.</p>
                      </template>
                      <template #not-found>
                        <p>Content not found. Path: {{ path }}</p>
                      </template>
                    </ContentDoc>
                  </template>
                  <template v-else>
                    <div v-html="githubContent" class="markdown-content"></div>
                  </template>
                </div>
              </div>
            </ClientOnly>
          </div>
        </div>
      </div>
    </ClientOnly>

    <!-- Footer section -->
    <div
      class="page-footer"
      style="
        background: #1d1b1b;
        padding: 32px;
        max-height: 80px;
        display: flex;
        justify-content: center;
        align-items: center;
      "
    >
      <h1
        style="
          color: white;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 142%;
        "
      >
        ©2024 ECHO
      </h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { queryContent } from "#imports";
import { useGithub } from "~/composables/useGithub";
import { useToast } from "~/composables/useToast";
import { useNavigation } from "~/composables/useNavigation";
import { useAsyncData } from "#app";
import Editor from "~/components/playground/Editor.vue";
import CollaborationSidebar from "~/components/CollaborationSidebar.vue";
import ContentCreator from "~/components/ContentCreator.vue";
import DesignSidebar from "~/components/DesignSidebar.vue";
import Header from "~/components/Header.vue";
import { useRuntimeConfig, useNuxtApp } from "#app";
import { marked } from "marked";

// Initialize GitHub functionality and services
const {
  getRawContent,
  saveFileContent,
  isLoggedIn,
  currentBranch,
  fetchBranches,
  branches,
} = useGithub();

const { refreshNavigation } = useNavigation();
const { showToast } = useToast();

// State management
const loading = ref(false);
const isEditing = ref(false);
const githubContent = ref("");
const editorContent = ref("");
const contentKey = ref(0);
const contentLastModified = ref<string | null>(null);

// Route handling setup
const route = useRoute();
const slug = route.params.slug || [];
const path = Array.isArray(slug) ? slug.join("/") : slug;

// Compute whether to show sidebar based on path
const showSidebar = computed(() => path !== "");

// Compute the content file path
const contentPath = computed(() => {
  if (!path) return "content/index.md"; // Default to index.md for root

  // If the path ends with a slash, assume it's a folder and append index.md
  if (path.endsWith("/")) {
    return `content/${path}index.md`;
  }

  // Otherwise, treat it as a file and append .md
  return `content/${path}.md`;
});

/**
 * Load GitHub content
 */
const loadGithubContent = async () => {
  if (!isLoggedIn.value) return;

  try {
    let contentPathToLoad = contentPath.value;

    // First, try to load the content as a folder (with index.md)
    try {
      const folderContent = await getRawContent(
        "tiresomefanatic",
        "EchoProdTest",
        contentPathToLoad,
        currentBranch.value
      );
      githubContent.value = marked(folderContent);
      editorContent.value = folderContent;
      contentKey.value++; // Force re-render
      return;
    } catch (folderError) {
      console.log(
        "No index.md found in folder, treating as a file:",
        folderError
      );
    }

    // If the folder approach fails, treat it as a file
    const fileContent = await getRawContent(
      "tiresomefanatic",
      "EchoProdTest",
      contentPathToLoad,
      currentBranch.value
    );

    // Convert markdown to HTML
    githubContent.value = marked(fileContent);
    editorContent.value = fileContent;
    contentKey.value++; // Force re-render
  } catch (error) {
    console.error("Error loading GitHub content:", error);
    showToast({
      title: "Error",
      message: "Failed to load content from GitHub",
      type: "error",
    });
  }
};

/**
 * Handle visibility change event
 */
const handleVisibilityChange = async () => {
  if (
    document.visibilityState === "visible" &&
    !isEditing.value &&
    isLoggedIn.value
  ) {
    await loadGithubContent();
    await refreshNavigation(); // Refresh navigation when tab becomes visible
  }
};

/**
 * Handles the edit button click.
 */
const handleEditClick = async () => {
  if (!isLoggedIn.value) {
    showToast({
      title: "Authentication Required",
      message: "Please sign in with GitHub to edit content",
      type: "warning",
    });
    return;
  }

  console.log("Edit clicked. Content path:", contentPath.value); // Debug log

  isEditing.value = true;
  await loadGithubContent();
};

const handleContentChange = (newContent: string) => {
  editorContent.value = newContent;
};

/**
 * Handles saving content to GitHub.
 */
const handleSave = async (content: string) => {
  if (!content || !isLoggedIn.value) {
    showToast({
      title: "Error",
      message: "Please sign in to save changes",
      type: "error",
    });
    return;
  }

  try {
    const result = await saveFileContent(
      "tiresomefanatic",
      "EchoProdTest",
      contentPath.value,
      content,
      `Update ${contentPath.value}`,
      currentBranch.value
    );

    if (result) {
      // Update local content immediately
      githubContent.value = marked(content);
      editorContent.value = content;
      contentKey.value++; // Force re-render

      // Refresh navigation to reflect changes
      await refreshNavigation();

      showToast({
        title: "Success",
        message: `Content saved successfully to branch: ${currentBranch.value}`,
        type: "success",
      });

      isEditing.value = false;
      await loadGithubContent(); // Refresh content from GitHub
    } else {
      throw new Error(`Failed to save to branch: ${currentBranch.value}`);
    }
  } catch (error) {
    console.error(`Error saving content:`, error);
    showToast({
      title: "Error",
      message: `Failed to save to branch: ${currentBranch.value}`,
      type: "error",
    });
  }
};

const handleEditorError = (error: Error) => {
  showToast({
    title: "Editor Error",
    message: error.message,
    type: "error",
  });
};

const exitEditor = async () => {
  await loadGithubContent();
  isEditing.value = false;
};

const handleLoadSave = (content: string) => {
  editorContent.value = content;
  githubContent.value = marked(content);
  contentKey.value++; // Force re-render
  isEditing.value = true; // Switch to edit mode to show the loaded content
};

const handleBranchChange = async () => {
  await loadGithubContent();
  await refreshNavigation(); // Refresh navigation when branch changes
};

// Handle new content creation
const handleContentCreated = async () => {
  await refreshNavigation();
  showToast({
    title: "Success",
    message: "Content structure updated",
    type: "success",
  });
};

// Watch for editing mode changes
watch(isEditing, async (newValue, oldValue) => {
  if (newValue && !oldValue) {
    await loadGithubContent();
  }
});

// Watch for route changes
watch(
  () => route.path,
  async () => {
    if (isLoggedIn.value && !isEditing.value) {
      console.log(
        "Route changed, loading GitHub content for path:",
        contentPath.value
      ); // Debug log
      await loadGithubContent();
      await refreshNavigation(); // Refresh navigation on route change
    }
  }
);

// Watch for login state changes
watch(isLoggedIn, async (newValue) => {
  if (newValue && !isEditing.value) {
    await loadGithubContent();
    await refreshNavigation(); // Refresh navigation on login state change
  }
});

// Setup content refresh and event handlers
onMounted(async () => {
  if (isLoggedIn.value && !isEditing.value) {
    await loadGithubContent();
    await refreshNavigation(); // Initial navigation load
  }

  if (process.client) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
});

onBeforeUnmount(() => {
  if (process.client) {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }
});
</script>

<style>
/* Global prose styles - these are essential */
.prose-content {
  max-width: 100%;
  width: 100%;
  margin: 0;
  color: #000000;
  font-size: 16px;
  line-height: 1.6;
}

.prose-content h1 {
  font-size: 2em;
  margin: 1.2em 0 0.6em;
  font-weight: 600;
  line-height: 1.2;
  color: #000000;
}

.prose-content h2 {
  font-size: 1.5em;
  margin: 1em 0 0.5em;
  font-weight: 600;
  line-height: 1.3;
  color: #000000;
}

.prose-content h3 {
  font-size: 1.25em;
  margin: 0.8em 0 0.4em;
  font-weight: 600;
  line-height: 1.4;
  color: #000000;
}

.prose-content p {
  margin: 1em 0;
  color: #000000;
}

.prose-content ul,
.prose-content ol {
  margin: 1em 0;
  padding-left: 1.5em;
  color: #000000;
}

.prose-content li {
  margin: 0.5em 0;
}

.prose-content a {
  color: #4361ee;
  text-decoration: underline;
}

.prose-content blockquote {
  border-left: 4px solid #e5e7eb;
  margin: 1.5em 0;
  padding-left: 1em;
  color: #4b5563;
}

.prose-content code {
  background: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: ui-monospace, monospace;
}

.prose-content pre {
  background: #f3f4f6;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1.5em 0;
}

.prose-content pre code {
  background: none;
  padding: 0;
  font-size: 0.9em;
  color: #000000;
}

.prose-content img {
  max-width: 100%;
  height: auto;
  margin: 1.5em 0;
}

.prose-content hr {
  border: 0;
  border-top: 1px solid #e5e7eb;
  margin: 2em 0;
}
</style>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  position: relative;
  width: 100%;
  overflow-x: hidden;
}

.content-area {
  display: flex;
  background: white;
  min-height: calc(100vh - 64px);
  position: relative;
  width: 100%;
}

.content-area.editing-mode {
  padding: 0;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: white;
  border-right: 1px solid #e5e7eb;
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.main-content {
  flex: 1;
  min-width: 0; /* Prevent flex item from overflowing */
  padding: 32px;
  position: relative;
}

.main-content.with-sidebar {
  width: calc(100% - 280px);
}

.content-header {
  margin: 20px 26px;
  padding: 4px 8px;
  display: flex;
  justify-content: flex-end;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  align-items: start;
}

.markdown-content {
  @apply prose prose-sm md:prose-base lg:prose-lg max-w-none;
}

.editor-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 200px);
  margin: 0;
  padding: 20px;
  width: 100%;
}

.branch-select-wrapper {
  position: relative;
  display: inline-block;
}

.branch-select {
  appearance: none;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #374151;
  min-width: 160px;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
}

.branch-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.branch-select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.loading-indicator {
  position: absolute;
  right: 2.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

/* Editing mode styles */
.editing-mode .sidebar {
  @apply hidden;
}

.editing-mode .main-content {
  @apply ml-0;
}

/* Mobile styles */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
  }

  .sidebar.active {
    transform: translateX(0);
  }
}

.page-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
}
</style>
