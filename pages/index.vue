<template>
  <div class="landing-page-wrapper">
    <ClientOnly>
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="min-h-screen flex items-center justify-center bg-gray-50"
      >
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
        ></div>
      </div>

      <!-- Content (only shown when loading is complete) -->
      <div v-else>
        <!-- Add the ActionBar component when user is logged in -->
        <ActionBar v-if="isLoggedIn" />
        <Header />

        <!--sidebar and overlay -->
        <div class="mobile-overlay"></div>
        <DesignSidebar class="sidebar" />

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
                <!-- Direct HTML Content Instead of Markdown -->
                <div class="landing-content">
                  <!-- Hero Banner -->
                  <div class="hero-banner">
                    <img
                      src="/images/hero-banner.png"
                      alt="Foundation of Design Banner"
                    />
                  </div>

                  <!-- Get Started Section -->
                  <div class="content-container">
                    <h2 class="section-title">Get started</h2>

                    <!-- Cards Grid -->
                    <div class="cards-grid">
                      <!-- Design Card -->
                      <router-link to="/design" class="card-link">
                        <div class="card">
                          <div class="card-image-container">
                            <img
                              src="/images/intro-design.png"
                              alt="Design concept"
                              class="card-image"
                            />
                          </div>
                          <div class="card-content">
                            <h3 class="card-title">Design</h3>
                            <p class="card-text">
                              Lorem ipsum dolor sit amet consectetur, ut aliquet
                              sit amet consectetur Lorem ipsum.
                            </p>
                          </div>
                        </div>
                      </router-link>

                      <!-- Develop Card -->
                      <router-link to="/develop" class="card-link">
                        <div class="card">
                          <div class="card-image-container">
                            <img
                              src="/images/intro-develop.png"
                              alt="Develop concept"
                              class="card-image"
                            />
                          </div>
                          <div class="card-content">
                            <h3 class="card-title">Develop</h3>
                            <p class="card-text">
                              Lorem ipsum dolor sit amet consectetur, ut aliquet
                              sit amet consectetur Lorem ipsum.
                            </p>
                          </div>
                        </div>
                      </router-link>

                      <!-- Contribute Card -->
                      <router-link to="/contribute" class="card-link">
                        <div class="card">
                          <div class="card-image-container">
                            <img
                              src="/images/intro-contribute.png"
                              alt="Contribute concept"
                              class="card-image"
                            />
                          </div>
                          <div class="card-content">
                            <h3 class="card-title">Contribute</h3>
                            <p class="card-text">
                              Lorem ipsum dolor sit amet consectetur, ut aliquet
                              sit amet consectetur Lorem ipsum.
                            </p>
                          </div>
                        </div>
                      </router-link>
                    </div>

                    <!-- What is Echosystem Section -->
                    <div class="echosystem-section">
                      <h2 class="section-title">What is the Echosystem?</h2>
                      <p class="section-text">
                        Echo is the Design System we use to create Vida
                        products. Our main goal is to offer everything in one
                        place — assets, resources, files, and guidelines. Always
                        accessible to the people that need them and always
                        available in the spaces that we work in.
                      </p>
                    </div>

                    <!-- Foundation Concept Image -->
                    <div class="foundation-image-container">
                      <img
                        src="/images/foundation-concept.png"
                        alt="Foundation concept visualization"
                        class="foundation-image"
                      />
                    </div>

                    <!-- Goals Section -->
                    <div class="goals-section">
                      <div class="goals-content">
                        <h2 class="goals-title">Goals</h2>
                        <p class="goals-intro">
                          Echo is the Design System we use to create Vida
                          products. Our main goal is to offer everything in one
                          place — assets, resources, files, and guidelines.
                          Always accessible to the people that need them and
                          always available in the spaces that we work in.
                        </p>

                        <div class="goal-item">
                          <h3 class="goal-subtitle">Goal #1</h3>
                          <p class="goal-text">
                            Lorem ipsum dolor sit amet consectetur. Et et
                            ultrices dolor ut. Vitae pharetra nullam dolor
                            vestibulum pharetra et. Pretium consequat venenatis
                            augue quam nibh laoreet.
                          </p>
                        </div>

                        <div class="goal-item">
                          <h3 class="goal-subtitle">Goal #2</h3>
                          <p class="goal-text">
                            Lorem ipsum dolor sit amet consectetur. Et et
                            ultrices dolor ut. Vitae pharetra nullam dolor
                            vestibulum pharetra et. Pretium consequat venenatis
                            augue quam nibh laoreet.
                          </p>
                        </div>

                        <div class="goal-item">
                          <h3 class="goal-subtitle">Goal #3</h3>
                          <p class="goal-text">
                            Lorem ipsum dolor sit amet consectetur. Et et
                            ultrices dolor ut. Vitae pharetra nullam dolor
                            vestibulum pharetra et. Pretium consequat venenatis
                            augue quam nibh laoreet.
                          </p>
                        </div>

                        <div class="goal-item">
                          <h3 class="goal-subtitle">Goal #4</h3>
                          <p class="goal-text">
                            Lorem ipsum dolor sit amet consectetur. Et et
                            ultrices dolor ut. Vitae pharetra nullam dolor
                            vestibulum pharetra et. Pretium consequat venenatis
                            augue quam nibh laoreet.
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- Echo History Section -->
                    <div class="echo-history-section">
                      <h2 class="section-title">How did ECHO come about?</h2>
                      <p class="section-text">
                        The design system utilizes a curated color palette to
                        ensure a clear and consistent user experience. This
                        palette consists of a limited number of core colors,
                        each offered in a range of hues for increased
                        versatility. This approach allows for the creation of a
                        clear visual hierarchy within the app, where specific
                        colors can be assigned to highlight critical information
                        or distinguish between different features. By offering a
                        range of hues within each core color, the system
                        provides flexibility for creating subtle variations
                        within the overall theme while maintaining a cohesive
                        look and feel.
                      </p>
                    </div>

                    <!-- Banner Section -->
                    <div class="echo-banner">
                      <h2 class="banner-text">
                        Echoing from the past.<br />Echoing into the future.
                      </h2>
                    </div>

                    <!-- Additional Goals Section (appears to be a duplicate in the original) -->
                    <div class="additional-goals">
                      <h2 class="goals-title">Goals</h2>
                      <p class="goals-intro">
                        Echo is the Design System we use to create Vida
                        products. Our main goal is to offer everything in one
                        place — assets, resources, files, and guidelines. Always
                        accessible to the people that need them and always
                        available in the spaces that we work in.
                      </p>
                    </div>
                    <LandingFooter />
                  </div>
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useGithub } from "~/composables/useGithub";
import { useToast } from "~/composables/useToast";
import { marked } from "marked";
import ActionBar from "~/components/ActionBar.vue";
import { useEventBus } from "@vueuse/core";
import DesignSidebar from "~/components/DesignSidebar.vue";

const { getRawContent, saveFileContent, isLoggedIn, currentBranch } =
  useGithub();
const { showToast } = useToast();

// State management
const isLoading = ref(true);
const isEditing = ref(false);
const githubContent = ref("");
const editorContent = ref("");
const contentKey = ref(0);

// Content path for the landing page
const contentPath = computed(() => "content/index.md");

// Add sidebar state management
const isSidebarOpen = ref(false);
const sidebarBus = useEventBus("sidebar-toggle");

// Function to close sidebar
const closeSidebar = () => {
  console.log("Closing sidebar from landing page");
  isSidebarOpen.value = false;
  sidebarBus.emit(false);

  // Remove overflow hidden from body
  if (process.client) {
    document.body.style.overflow = "";
  }
};

// Listen for sidebar toggle events
onMounted(() => {
  // Subscribe to sidebar toggle events and ensure proper cleanup
  const unsubscribe = sidebarBus.on((value) => {
    console.log("Sidebar event received on index page:", value);

    // If the incoming value is a boolean, use it directly
    if (typeof value === "boolean") {
      isSidebarOpen.value = value;
    } else {
      // Otherwise toggle the current state
      isSidebarOpen.value = !isSidebarOpen.value;
    }

    // Apply overflow hidden to body when sidebar is open
    if (process.client) {
      document.body.style.overflow = isSidebarOpen.value ? "hidden" : "";
    }
  });

  // Clean up the event listener
  onUnmounted(() => {
    unsubscribe();
  });
});

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
    isLoading.value = false;
  }
};

// Load content when component is mounted
onMounted(async () => {
  if (isLoggedIn.value) {
    await loadGithubContent();
  } else {
    isLoading.value = false;
  }
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
  position: relative;
}

/* Style for the sidebar in mobile view */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background-color: white;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  overflow-y: auto;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.sidebar.is-mobile-open {
  transform: translateX(0);
}

.mobile-overlay {
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.mobile-overlay.is-visible {
  visibility: visible;
  opacity: 1;
}

/* Adjusted styling for medium screens (768px-1024px) */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: white;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
    z-index: 1001;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.is-mobile-open {
    transform: translateX(0);
  }
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

/* Landing Page Styles */
.landing-content {
  width: 100%;
}

.hero-banner {
  width: 100%;
  margin: 0 0 40px 0; /* Added bottom margin for spacing */
  padding: 0;
  overflow: hidden;
  height: 70vh; /* Much larger hero image taking 70% of viewport height */
  min-height: 600px; /* Minimum height to ensure it's always large */
  position: relative;
}

.hero-banner img {
  width: 100%;
  height: 100%;
  display: block;
  margin: 0;
  object-fit: cover;
  object-position: center;
}

.content-container {
  width: 100%;
  max-width: 1512px;
  margin: 0 auto;
  padding: 0 clamp(16px, calc((100vw - 1512px) / 2 + 276px), 276px);
}

.section-title {
  color: #000;
  font-size: 32px;
  font-style: normal;
  font-weight: 530;
  line-height: 120%;
  letter-spacing: -0.64px;
  margin: 0;
  text-align: start;
  padding: 42.5px 0px 32px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* Force exactly 3 columns */
  gap: 24px; /* Larger gap for better spacing */
  margin: 0;
  justify-content: center; /* Center the cards */
}

.card-link {
  text-decoration: none;
  color: inherit;
}

.card {
  background: white;
  border-radius: 16px;
  border: 1px solid #d4d4d4;
  overflow: hidden;
  width: 100%;
  max-width: 100%; /* Full width within the grid cell */
  margin: 0 auto; /* Center cards */
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-image-container {
  background: #000;
  height: clamp(90px, 35vw, 130px); /* Reduced height for smaller card images */
  display: flex;
  align-items: center;
  position: relative;
}

.card-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.card-content {
  padding: clamp(12px, 3vw, 20px);
  position: relative;
  background: white;
}

.card-title {
  color: #1e1e1e;
  font-size: 22px; /* Slightly smaller font size */
  font-style: normal;
  font-weight: 530;
  line-height: 140%;
  margin: 0 0 6px;
}

.card-text {
  color: #1e1e1e;
  font-family: "PP Neue Montreal";
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 140%;
  margin: 0;
}

.echosystem-section {
  margin: 64px 0 0;
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 5vw, 16px);
}

.section-text {
  color: #1e1e1e;
  font-family: "PP Neue Montreal";
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 140%;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .landing-content-area {
    padding: 0 24px;
  }

  .content-container {
    padding: 0 24px;
  }

  .cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 1024px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr); /* 2 columns on tablet */
  }

  .hero-banner {
    height: 50vh;
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .landing-content-area {
    padding: 0 16px;
  }

  .content-container {
    padding: 0 16px;
  }

  .cards-grid {
    grid-template-columns: 1fr; /* 1 column on mobile */
    gap: 20px;
  }

  .card {
    max-width: 100%;
    width: 100%;
    margin: 0 auto;
  }

  .card-image-container {
    height: 180px;
  }

  .section-title {
    font-size: 28px;
    padding: 32px 0px 24px;
  }

  .hero-banner {
    height: 40vh;
    min-height: 300px;
  }
}

/* Foundation Image Styles */
.foundation-image-container {
  background: #000;
  border-radius: 8px;
  padding: 40px;
  margin: 40px 0;
}

.foundation-image {
  width: 100%;
  height: auto;
  display: block;
}

/* Goals Section Styles */
.goals-section {
  margin: 64px 0 0;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
}

.goals-content {
  width: 100%;
}

.goals-title {
  color: #000;
  font-size: 24px;
  font-style: normal;
  font-weight: 530;
  line-height: normal;
  letter-spacing: -0.48px;
  margin: 0 0 16px;
}

.goals-intro {
  color: #1e1e1e;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 140%;
  margin: 0 0 24px;
}

.goal-item {
  margin-bottom: 16px;
}

.goal-subtitle {
  color: #000;
  font-size: 16px;
  font-style: normal;
  font-weight: 530;
  line-height: 140%;
  margin: 0;
}

.goal-text {
  color: #1e1e1e;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 140%;
  margin: 0;
}

/* Echo History Section */
.echo-history-section {
  margin: 80px 0 0;
}

/* Banner Section */
.echo-banner {
  width: 100%;
  max-width: 959px;
  height: 480px;
  background: #5377d3;
  margin: clamp(32px, 5vw, 64px) 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: min(24px, 3vw);
}

.banner-text {
  color: white;
  font-size: 32px;
  line-height: 1.4;
  margin: 0;
  font-weight: 700;
  text-align: center;
}

/* Additional Goals Section */
.additional-goals {
  margin: 40px 0 0;
}

/* Responsive adjustments for new sections */
@media (max-width: 768px) {
  .goals-section {
    grid-template-columns: 1fr;
  }

  .echo-banner {
    height: auto;
    padding: 40px 20px;
  }

  .banner-text {
    font-size: 24px;
  }
}
</style>
