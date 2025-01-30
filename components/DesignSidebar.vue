# DesignSidebar.vue
<template>
  <div class="sidebar-wrapper">
    <!-- Mobile menu button -->
    <button
      class="mobile-menu-btn"
      :class="{ 'is-open': isOpen }"
      @click="toggleMobileMenu"
      aria-label="Toggle menu"
    >
      <div class="hamburger-lines">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </div>
    </button>

    <!-- Sidebar -->
    <aside
      class="design-sidebar"
      :class="{ 'is-mobile-open': isOpen }"
      :key="navigationStructureKey"
    >
      <!-- Mobile header -->
      <div class="mobile-header">
        <span class="mobile-title">Menu</span>
        <button class="close-btn" @click="toggleMobileMenu">
          <span class="close-icon">×</span>
        </button>
      </div>

      <nav class="design-nav">
        <div class="nav-content">
          <template v-if="isLoading">
            <div class="loading-state">
              <div class="loading-spinner"></div>
              Loading...
            </div>
          </template>

          <template v-else>
            <div
              v-for="section in navigationStructure"
              :key="section.path"
              class="nav-group"
            >
              <!-- Section Header -->
              <div
                class="nav-group-header"
                :class="{
                  'main-item': true,
                  locked: section.locked,
                  active: isActiveSection(section.path),
                }"
                @click="!section.locked && toggleSection(section.path)"
              >
                {{ section.title }}
                <template v-if="section.type === 'directory'">
                  <span
                    class="chevron"
                    :class="{ rotated: !isCollapsed[section.path] }"
                    >›</span
                  >
                </template>
                <img
                  v-if="section.locked"
                  src="/lock-icon.svg"
                  alt="Locked"
                  class="lock-icon"
                />
              </div>

              <!-- Section Content -->
              <div
                v-if="section.type === 'directory'"
                class="nav-section"
                :class="{ collapsed: isCollapsed[section.path] }"
              >
                <div class="nav-section-inner">
                  <template v-for="item in section.children" :key="item.path">
                    <!-- Nested Directory -->
                    <template v-if="item.type === 'directory'">
                      <div
                        class="nav-group-header sub-item"
                        :class="{
                          locked: item.locked,
                          active: isActiveSection(item.path),
                        }"
                        @click="!item.locked && toggleSection(item.path)"
                      >
                        {{ item.title }}
                        <span
                          class="chevron"
                          :class="{ rotated: !isCollapsed[item.path] }"
                          >›</span
                        >
                      </div>
                      <div
                        class="nav-section nested"
                        :class="{ collapsed: isCollapsed[item.path] }"
                      >
                        <div class="nav-section-inner">
                          <template
                            v-for="child in item.children"
                            :key="child.path"
                          >
                            <!-- Show all files, both locked and unlocked -->
                            <NuxtLink
                              v-if="child.type === 'file' && !child.locked"
                              :to="child.path"
                              class="nav-item sub-item"
                              :class="{
                                'router-link-active': route.path === child.path,
                              }"
                              @click="closeMobileMenu"
                            >
                              {{ child.title }}
                            </NuxtLink>
                            <div
                              v-else-if="child.type === 'file' && child.locked"
                              class="nav-item sub-item locked"
                              :title="'This feature is coming soon'"
                            >
                              {{ child.title }}
                              <img
                                src="/lock-icon.svg"
                                alt="Locked"
                                class="lock-icon"
                              />
                            </div>
                          </template>
                        </div>
                      </div>
                    </template>

                    <!-- File Items (both locked and unlocked) -->
                    <NuxtLink
                      v-else-if="item.type === 'file' && !item.locked"
                      :to="item.path"
                      class="nav-item sub-item"
                      :class="{
                        'router-link-active': route.path === item.path,
                      }"
                      @click="closeMobileMenu"
                    >
                      {{ item.title }}
                    </NuxtLink>
                    <div
                      v-else-if="item.type === 'file' && item.locked"
                      class="nav-item sub-item locked"
                      :title="'This feature is coming soon'"
                    >
                      {{ item.title }}
                      <img
                        src="/lock-icon.svg"
                        alt="Locked"
                        class="lock-icon"
                      />
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </template>
        </div>
      </nav>
    </aside>

    <!-- Mobile overlay -->
    <div
      class="mobile-overlay"
      :class="{ 'is-visible': isOpen }"
      @click="toggleMobileMenu"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useNavigation } from "../composables/useNavigation";
import { useGithub } from "../composables/useGithub";

const route = useRoute();
const isOpen = ref(false);
const isCollapsed = ref<Record<string, boolean>>({});

const { navigationStructure, isLoading, refreshNavigation } = useNavigation();
const { currentBranch } = useGithub();

// Create a computed key to force re-render when navigationStructure changes
const navigationStructureKey = computed(() =>
  JSON.stringify(navigationStructure.value)
);

// Check if a section is currently active
const isActiveSection = (sectionPath: string): boolean => {
  return route.path.startsWith(sectionPath);
};

// Toggle section collapse state
const toggleSection = (path: string) => {
  isCollapsed.value[path] = !isCollapsed.value[path];
};

// Mobile menu handlers
const toggleMobileMenu = () => {
  isOpen.value = !isOpen.value;
  document.body.style.overflow = isOpen.value ? "hidden" : "";
};

const closeMobileMenu = () => {
  isOpen.value = false;
  document.body.style.overflow = "";
};

// Watch for branch changes to refresh navigation
watch(currentBranch, async () => {
  await refreshNavigation();
});

// Watch route changes to expand current section
watch(
  () => route.path,
  (newPath) => {
    // Find and expand all parent sections of the current route
    navigationStructure.value.forEach((section) => {
      if (section.type === "directory") {
        if (newPath.startsWith(section.path)) {
          isCollapsed.value[section.path] = false;
          // Also expand any nested directories
          section.children?.forEach((child) => {
            if (child.type === "directory" && newPath.startsWith(child.path)) {
              isCollapsed.value[child.path] = false;
            }
          });
        }
      }
    });
  },
  { immediate: true }
);

// Initial setup
onMounted(async () => {
  await refreshNavigation();
});
</script>

<style scoped>
.sidebar-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.design-sidebar {
  width: 280px;
  background: white;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.design-nav {
  height: 100%;
  padding: 1rem;
}

.nav-content {
  background: #f7f7f7;
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.loading-state {
  padding: 1rem;
  text-align: center;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
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

.nav-group {
  display: flex;
  flex-direction: column;
}

.main-item {
  font-size: 1.125rem;
  font-weight: 400;
  color: #000000;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
}

.sub-item {
  font-size: 1rem;
  font-weight: 400;
  color: #000000;
  padding: 0.5rem 0.75rem;
  margin-left: 0.5rem;
  line-height: 150%;
  letter-spacing: 0.15px;
}

.nav-item {
  text-decoration: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.nav-item.locked,
.nav-group-header.locked {
  color: #999;
  cursor: not-allowed;
  pointer-events: none;
}

.nav-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.nav-section {
  overflow: hidden;
  transition: height 0.3s ease-in-out;
  height: auto;
}

.nav-section.collapsed {
  height: 0;
}

.nav-section.nested {
  margin-left: 0.5rem;
}

.nav-section-inner {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.25rem 0;
}

.chevron {
  font-size: 1.25rem;
  transition: transform 0.3s ease;
  display: inline-block;
}

.chevron.rotated {
  transform: rotate(90deg);
}

.lock-icon {
  width: 16px;
  height: 16px;
}

/* Hover states */
.nav-item:not(.locked):hover,
.nav-group-header:not(.locked):hover {
  background: rgba(0, 0, 0, 0.05);
}

/* Active states */
.nav-item.router-link-active {
  font-weight: 500;
  background: rgba(0, 0, 0, 0.05);
}

.nav-group-header.active:not(.locked) {
  background: rgba(0, 0, 0, 0.02);
}

/* Mobile styles */
.mobile-menu-btn {
  display: none;
}

.mobile-header {
  display: none;
}

.mobile-overlay {
  display: none;
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
    position: fixed;
    top: 32px;
    left: 1rem;
    width: 48px;
    height: 48px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    z-index: 1002;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: background-color 0.2s ease;
  }

  .mobile-menu-btn:hover {
    background-color: #f8f9fa;
  }

  .hamburger-lines {
    width: 24px;
    height: 18px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }

  .hamburger-line {
    width: 100%;
    height: 2px;
    background-color: #333;
    transition: all 0.3s ease;
  }

  .mobile-menu-btn.is-open .hamburger-line:nth-child(1) {
    transform: translateY(8px) rotate(45deg);
  }

  .mobile-menu-btn.is-open .hamburger-line:nth-child(2) {
    opacity: 0;
  }

  .mobile-menu-btn.is-open .hamburger-line:nth-child(3) {
    transform: translateY(-8px) rotate(-45deg);
  }

  .design-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
    z-index: 1001;
    background: white;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  }

  .design-sidebar.is-mobile-open {
    transform: translateX(0);
  }

  .mobile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    background: white;
  }

  .mobile-title {
    font-size: 1.125rem;
    font-weight: 500;
  }

  .close-btn {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-icon {
    font-size: 24px;
    color: #666;
    line-height: 1;
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    z-index: 1000;
  }

  .mobile-overlay.is-visible {
    opacity: 1;
    visibility: visible;
  }

  .nav-content {
    height: calc(100vh - 64px);
    overflow-y: auto;
    margin: 0;
    border-radius: 0;
  }

  /* iOS-specific fixes */
  @supports (-webkit-touch-callout: none) {
    .design-sidebar {
      height: -webkit-fill-available;
    }

    .nav-content {
      height: calc(100vh - 64px - env(safe-area-inset-bottom));
    }
  }
}
</style>
