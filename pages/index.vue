<template>
  <div class="landing-page-wrapper">
    <ClientOnly>
      <div>
      
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

const {
  getRawContent,
  saveFileContent,
  isLoggedIn,
  currentBranch,
} = useGithub();
const { showToast } = useToast();

// State management
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
  if (!isLoggedIn.value) return;

  try {
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
  } catch (error) {
    console.error("Error loading GitHub content:", error);
    showToast({
      title: "Error",
      message: "Failed to load content from GitHub",
      type: "error",
    });
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
:deep(.markdown-content) {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;

  /* Reset max-width constraints */
  & > div {
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Hero Section */
  & > div > div:first-child {
    padding: 0 !important;
    margin-bottom: 64px !important;
  }

  & img[alt="Foundation of Design Banner"] {
    width: 100% !important;
    height: 400px !important;
    object-fit: cover !important;
    border-radius: 24px !important;
    margin: 0 !important;
  }

  /* Section Titles */
  & h2 {
    color: #000 !important;
    font-size: 24px !important;
    font-weight: 530 !important;
    line-height: 120% !important;
    letter-spacing: -0.48px !important;
    margin: 42.5px 0 32px !important;
    text-align: start !important;
  }

  /* Cards Grid */
  & div[style*="grid-template-columns"] {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 24px !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
  }

  /* Card Styles */
  & div[style*="border-radius: 16px"] {
    background: white !important;
    border: 1px solid #D4D4D4 !important;
    border-radius: 16px !important;
    overflow: hidden !important;
    width: 100% !important;
    margin: 0 !important;
    transition: transform 0.2s ease !important;
  }

  /* Card Image Container */
  & div[style*="background: #000"] {
    height: 200px !important;
    background: #000 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    position: relative !important;
  }

  & div[style*="background: #000"] img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }

  /* Card Content */
  & div[style*="padding: clamp"] {
    padding: 24px !important;
    position: relative !important;
    background: white !important;
  }

  & h3 {
    color: #1E1E1E !important;
    font-size: 16px !important;
    font-weight: 700 !important;
    line-height: 140% !important;
    margin: 0 0 8px !important;
  }

  & p {
    color: #757575 !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    line-height: 140% !important;
    margin: 0 !important;
  }

  /* Ecosystem Section */
  & div[style*="display: flex"][style*="flex-direction: row"] {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    gap: 32px !important;
    margin: 64px 0 0 !important;
    width: 100% !important;
  }

  & div[style*="display: flex"][style*="flex-direction: row"] h2 {
    font-size: 24px !important;
    margin: 0 0 16px !important;
    flex: 1 !important;
  }

  & div[style*="display: flex"][style*="flex-direction: row"] p {
    margin: 0 !important;
    line-height: 1.6 !important;
    color: #666 !important;
    flex: 1 !important;
    font-size: 16px !important;
  }

  /* Echo Experience Section */
  & div[style*="background: #5377D3"] {
    width: 100% !important;
    height: 480px !important;
    background: #5377D3 !important;
    border-radius: 24px !important;
    margin: 64px 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-direction: column !important;
    padding: 80px !important;
  }

  & div[style*="background: #5377D3"] h2 {
    color: white !important;
    font-size: 48px !important;
    line-height: 1.4 !important;
    margin: 0 !important;
    font-weight: 700 !important;
    text-align: center !important;
  }

  /* Footer Links Section */
  & div[style*="display: flex"][style*="justify-content: center"] {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 64px !important;
    background: transparent !important;
    padding: 64px 0 !important;
    width: 100% !important;
  }

  & a[style*="display: flex"] {
    display: inline-flex !important;
    width: auto !important;
    background: transparent !important;
    padding: 0 !important;
    color: #4361EE !important;
    font-weight: 500 !important;
  }
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

  :deep(.markdown-content) {
    & div[style*="grid-template-columns"] {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 16px !important;
    }

    & div[style*="display: flex"][style*="flex-direction: row"] {
      flex-direction: column !important;
    }

    & div[style*="background: #5377D3"] {
      padding: 60px 40px !important;
    }

    & div[style*="background: #5377D3"] h2 {
      font-size: 36px !important;
    }
  }
}

@media (max-width: 768px) {
  .landing-content-area {
    padding: 0 16px;
  }

  :deep(.markdown-content) {
    & div[style*="grid-template-columns"] {
      grid-template-columns: 1fr !important;
    }

    & div[style*="background: #5377D3"] {
      height: auto !important;
      padding: 40px 24px !important;
    }

    & div[style*="background: #5377D3"] h2 {
      font-size: 28px !important;
    }

    & div[style*="display: flex"][style*="justify-content: center"] {
      grid-template-columns: 1fr !important;
      gap: 32px !important;
    }
  }
}
</style> 