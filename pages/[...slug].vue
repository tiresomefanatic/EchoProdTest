# [...slug].vue
<template>
  <div class="page-wrapper">
    <ClientOnly>
      <Header class="menu-bar" />
      
      <div class="main-container">
        <div class="content">
          <DesignSidebar class="sidebar" />
          <div class="text-container">
            <div class="body-container">
              <ClientOnly>
                <div v-if="isEditing" class="editor-container">
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
                    @load-save="handleLoadSave"
                  />
                </div>
                <div v-else class="prose-content">
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
          <TableOfContents v-if="!isEditing" class="table-of-contents" />
        </div>
        <Footer class="full-width-footer" />
      </div>
    </ClientOnly>
  </div>
  
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { navigateTo } from "#app";
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
import TableOfContents from "~/components/TableOfContents.vue";
import Footer from "~/components/Footer.vue";
// Initialize GitHub functionality and services
const {
  getRawContent,
  saveFileContent,
  isLoggedIn,
  currentBranch,
  fetchBranches,
  branches,
  switchBranch,
  clearContentPolling,
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

// Redirect to index page if we're at the root
onMounted(() => {
  if (!path) {
    navigateTo("/");
  }
  console.log('isEditing value:', isEditing.value);
});

// Compute whether to show sidebar based on path
const showSidebar = computed(() => true);

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

const handleBranchChange = async (event: Event) => {
  const select = event.target as HTMLSelectElement;
  const newBranch = select.value;

  if (newBranch !== currentBranch.value) {
    await switchBranch(newBranch);
    await loadGithubContent();
    await refreshNavigation();
  }
};

// Add a watch for currentBranch to handle initial load
watch(currentBranch, async (newBranch) => {
  if (isLoggedIn.value && !isEditing.value) {
    await loadGithubContent();
    await refreshNavigation();
  }
}, { immediate: true });

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
watch(isEditing, (newValue) => {
  console.log('isEditing changed to:', newValue);
  if (newValue && !isEditing.value) {
    isEditing.value = newValue;
    loadGithubContent();
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

// Add watch for branches
watch(branches, async (newBranches) => {
  if (newBranches.length > 0) {
    // Force re-render of branch selector
    contentKey.value++;
  }
}, { deep: true });

// Setup content refresh and event handlers
onMounted(async () => {
  if (isLoggedIn.value) {
    await fetchBranches(); // Ensure branches are loaded initially
    if (!isEditing.value) {
      await loadGithubContent();
      await refreshNavigation();
    }
  }

  if (process.client) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
});

onBeforeUnmount(() => {
  if (process.client) {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    clearContentPolling(); // Clean up content polling
  }
});
</script>

<style>
/* Global prose styles - these are essential */
.prose-content {
  max-width: 740px; /* From Figma measurement */
  margin: 0;
  padding: 0;
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
  display: flex;
width: 100%;
min-width: 982px;
padding-bottom: 80px;
flex-direction: column;
align-items: center;
}

.main-container {
  display: flex;
  width: 100%;
  max-width: 1512px;
  padding: 60px 20px;
  flex-direction: column;
  align-items: center;
  gap: 64px;
}

.content {
  display: flex;
  width: 100%;
justify-content: center;
align-items: flex-start;
gap: 40px;
}

@media screen and (min-width: 768px) and (max-width: 1024px) {
  .sidebar {
    width: 0px;
  }
  .content{
    padding: 0px 165.5px;
  }
}

.sidebar {
  display: flex;
flex-direction: column;
align-items: center;
}

.text-container {
  display: flex;
  justify-content: space-evenly;
  align-items: flex-start;
  flex: 1;
}

.body-container {
  max-width: 740px;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  min-width:0px;
}

.table-of-contents {
  flex-shrink: 0;
  position: sticky;
  top: 100px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  height: fit-content;
}

/* Main styles - 1380px and above */
@media screen and (min-width: 1380px) {
  .content {
    padding: 0px 266px;
  }
}

/* 1024px - 1380px */
@media screen and (min-width: 1024px) and (max-width: 1379px) {
  .content {
    padding: 0px 199.5px;
  }
}



/* Mobile - below 768px */
@media screen and (max-width: 767px) {
  .page-wrapper {
    min-width: 100%;
    padding-bottom: 40px;
  }

  .main-container {
    padding: 20px 10px;
    max-width: 100%;
  }

  .content {
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 0;
    width: 100%;
  }

  .text-container {
    width: 100%;
    padding: 0 15px;
    display: flex;
    justify-content: center;
  }

  .body-container {
    width: 100%;
    max-width: 100%;
    padding: 0;
  }

  .prose-content {
    width: 100%;
    max-width: 100%;
    padding: 0 15px;
  }

  .sidebar {
    width: 100%;
    position: static;
    margin-bottom: 20px;
  }

  .table-of-contents {
    display: none;
  }
}

/* Typography styles */
.prose-content {
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
}

.prose-content h1 {
  font-size: 60px;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
}

.prose-content h2 {
  font-size: 48px;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 48px 0 24px;
}

.prose-content h3 {
  font-size: 36px;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 32px 0 16px;
}

.prose-content p {
  font-size: 16px;
  line-height: 1.6;
  margin: 16px 0;
  color: #1F2937;
}

/* Editor styles */
.editor-container {
  width: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 200px);
  padding: 40px;
}

.content-area {
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 40px;
}

.main-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 40px;
  flex: 1;
}

.content-area.editing-mode {
  padding: 0;
}

.content-header {
  position: fixed;
  top: 76px;
  left: calc(266px + 195px); /* Left margin + sidebar width */
  right: 266px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 16px 0;
}

.markdown-content {
  @apply prose prose-sm md:prose-base lg:prose-lg max-w-none;
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

</style>
