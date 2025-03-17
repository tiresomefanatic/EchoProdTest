<template>
  <div class="landing-page-wrapper">
    <ClientOnly>
      <!-- Loading State -->
      <div v-if="isLoading" class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
      
      <!-- Content (only shown when loading is complete) -->
      <div v-else>
        <!-- Add the ActionBar component when user is logged in -->
        <ActionBar v-if="isLoggedIn" />
        <Header />
        
        <div class="landing-content-area">
          <div class="main-content">
            <ClientOnly>
              <div v-if="isEditing" class="editor-container mt-4">
                <TiptapEditor
                  :content="editorContent"
                  :filePath="contentPath"
                  @update:content="handleContentChange"
                  @save="handleSave"
                  @error="handleEditorError"
                />
              </div>
              <div v-else class="prose-content">
                <div :key="githubContent">
                  <template v-if="!isLoggedIn">
                    <ContentDoc path="/" :head="false">
                      <template #empty>
                        <p>No content found.</p>
                      </template>
                      <template #not-found>
                        <p>Content not found.</p>
                      </template>
                    </ContentDoc>
                  </template>
                  <template v-else>
                    <div v-html="githubContent" class="markdown-content">
                    </div>
                    <Footer />
                  </template>
                </div>
              </div>
            </ClientOnly>
          </div>
        </div>
      </div>
    </ClientOnly>
    <!-- Footer section -->
    <div class="page-footer">
      <h1>©2024 ECHO</h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useGithub } from "~/composables/useGithub";
import { useToast } from "~/composables/useToast";
import { marked } from "marked";
import ActionBar from '~/components/ActionBar.vue';

const {
  getRawContent,
  saveFileContent,
  isLoggedIn,
  currentBranch,
} = useGithub();
const { showToast } = useToast();

// State management
const isLoading = ref(true);
const isEditing = ref(false);
const githubContent = ref("");
const editorContent = ref("");
const contentKey = ref(0);

// Content path for the landing page
const contentPath = computed(() => "content/index.md");

/**
 * Load GitHub content
 */
const loadGithubContent = async () => {
  try {
    if (isLoggedIn.value) {
      const fileContent = await getRawContent(
        "tiresomefanatic",
        "EchoProdTest",
        contentPath.value,
        currentBranch.value
      );

      // Convert markdown to HTML and ensure it's a string
      const htmlContent = marked(fileContent).toString();
      githubContent.value = htmlContent;
      editorContent.value = fileContent;
      contentKey.value++;
    }
  } catch (error) {
    console.error("Error loading GitHub content:", error);
    showToast({
      title: "Error",
      message: "Failed to load content from GitHub",
      type: "error",
    });
  } finally {
    // Set loading to false after content is loaded or if there's an error
    setTimeout(() => {
      isLoading.value = false;
    }, 300);
  }
};

// Call loadGithubContent when component is mounted
onMounted(() => {
  loadGithubContent();
});

// Event handlers
const handleContentChange = (newContent: string) => {
  editorContent.value = newContent;
};

const handleSave = async (content: string) => {
  try {
    await saveFileContent(
      "tiresomefanatic",
      "EchoProdTest",
      contentPath.value,
      content,
      "Update content",
      currentBranch.value
    );
    showToast({
      title: "Success",
      message: "Content saved successfully",
      type: "success",
    });
  } catch (error) {
    showToast({
      title: "Error",
      message: "Failed to save content",
      type: "error",
    });
  }
};

const handleEditorError = (error: Error) => {
  showToast({
    title: "Error",
    message: error.message,
    type: "error",
  });
};
</script>

<style scoped>
.landing-page-wrapper {
  padding-top: v-bind('isLoggedIn ? "0" : "0"');
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: white;
  width: 100%;
}

.landing-content-area {
  flex: 1;
  width: 100%;
  margin: 0 auto;
  padding: 0 auto;
}

.main-content {
  width: 100%;
  margin: 0 auto;
  padding: 0;
}

.prose-content {
  width: 100%;
  max-width: none !important;
}

/* Landing Page Specific Markdown Styling */

.content-footer {
  width: 100%;
  margin: 0 !important;
  padding: 0 !important;
  display: flex;
  justify-content: center;
  align-items: center;
}

.page-footer {
  background: #1d1b1b;
  padding: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 80px;
}

.page-footer h1 {
  color: white;
  font-size: 14px;
  font-weight: 400;
}

/* Editor Container */
.editor-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 200px);
  margin: 0;
  padding: 20px;
  width: 100%;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .landing-content-area {
    padding: 0 24px;
  }
}

@media (max-width: 768px) {
  .landing-content-area {
    padding: 0 16px;
  }
}
</style> 