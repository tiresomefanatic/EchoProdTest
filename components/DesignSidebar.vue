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
        <span class="mobile-title">ECHO Design Guidelines</span>
        <button class="close-btn" @click="closeMobileMenu" aria-label="Close menu">
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
                            <!-- Recursively render nested directories -->
                            <template v-if="child.type === 'directory'">
                              <div
                                class="nav-group-header sub-item"
                                :class="{
                                  locked: child.locked,
                                  active: isActiveSection(child.path),
                                }"
                                @click="!child.locked && toggleSection(child.path)"
                              >
                                {{ child.title }}
                                <span
                                  class="chevron"
                                  :class="{ rotated: !isCollapsed[child.path] }"
                                  >›</span
                                >
                              </div>
                              <div
                                class="nav-section nested"
                                :class="{ collapsed: isCollapsed[child.path] }"
                              >
                                <div class="nav-section-inner">
                                  <template
                                    v-for="grandChild in child.children"
                                    :key="grandChild.path"
                                  >
                                    <!-- Files within nested directory -->
                                    <NuxtLink
                                      v-if="grandChild.type === 'file' && !grandChild.locked"
                                      :to="grandChild.path"
                                      class="nav-item sub-item"
                                      :class="{
                                        'router-link-active': route.path === grandChild.path,
                                      }"
                                      @click="closeMobileMenu"
                                    >
                                      {{ grandChild.title }}
                                    </NuxtLink>
                                    <div
                                      v-else-if="grandChild.type === 'file' && grandChild.locked"
                                      class="nav-item sub-item locked"
                                      :title="'This feature is coming soon'"
                                    >
                                      {{ grandChild.title }}
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
                            <!-- Files within directory -->
                            <NuxtLink
                              v-else-if="child.type === 'file' && !child.locked"
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
import { useEventBus } from '@vueuse/core';

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

// Listen for sidebar toggle events from header
const sidebarBus = useEventBus('sidebar-toggle');
sidebarBus.on((value) => {
  console.log('Sidebar event received in DesignSidebar:', value);
  
  // Set isOpen value based on provided value or toggle
  if (typeof value === 'boolean') {
    isOpen.value = value;
  } else {
    isOpen.value = !isOpen.value;
  }
  
  // Apply body overflow style
  if (process.client) {
    document.body.style.overflow = isOpen.value ? "hidden" : "";
    console.log('DesignSidebar isOpen is now:', isOpen.value);
  }
});

// Mobile menu handlers - simplified
const toggleMobileMenu = () => {
  // Use the event bus instead of direct toggling
  sidebarBus.emit(!isOpen.value);
};

const closeMobileMenu = () => {
  // Use the event bus instead of direct toggling
  sidebarBus.emit(false);
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
  position: relative;
  width: 195px;
  flex-shrink: 0;
}

.design-sidebar {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 0;
  box-sizing: border-box;
}

.design-nav {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.nav-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding-right: 8px;
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
  gap: 6px;
  margin-bottom: 4px;
}

.nav-group-header {
  display: flex;
  height: 32px;
  padding: 4px 0;
  align-items: center;
  gap: 12px;
  align-self: stretch;
  cursor: pointer;
  font-family: "PP Neue Montreal";
  font-size: 14px;
  font-style: normal;
  font-weight: 538;
  line-height: 24px;
  letter-spacing: 0.15px;
  color: #000;
}

.nav-group-header:hover:not(.locked) {
  font-weight: 538;
  color: rgba(0, 0, 0, 0.7);
}

.nav-group-header.active:not(.locked) {
  font-weight: 538;
}

.nav-item {
  display: flex;
  height: 32px;
  padding: 4px 0;
  align-items: center;
  gap: 12px;
  align-self: stretch;
  font-family: "PP Neue Montreal";
  font-size: 14px;
  font-style: normal;
  font-weight: 538;
  line-height: 24px;
  letter-spacing: 0.15px;
  color: #000;
  text-decoration: none;
}

.nav-item:hover:not(.locked) {
  font-weight: 538;
  color: rgba(0, 0, 0, 0.7);
}

.nav-item.router-link-active {
  font-weight: 538;
}

.nav-section {
  overflow: hidden;
  transition: height 0.3s ease-in-out;
  height: auto;
  padding-left: 16px;
  margin-top: 0;
}

.nav-section.collapsed {
  height: 0;
  margin-top: 0;
}

.nav-section-inner {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sub-item {
  padding-left: 16px;
}

.chevron {
  font-size: 16px;
  transition: transform 0.3s ease;
  margin-right: 4px;
  margin-left: 0;
  order: -1;
}

.chevron.rotated {
  transform: rotate(90deg);
}

.lock-icon {
  width: 16px;
  height: 16px;
  margin-left: auto;
}

.nav-item.locked,
.nav-group-header.locked {
  color: #999;
  cursor: not-allowed;
  pointer-events: none;
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

@media (max-width: 1024px) {
  .sidebar-wrapper {
    /* Remove positioning that might interfere */
    position: static;
    width: auto;
    height: 0;
    overflow: visible;
  }

  .design-sidebar {
    /* Fixed positioning handled by the outer sidebar container */
    background-color: white;
    padding-top: 0;
    height: 100vh;
    max-width: 100%;
    display: block !important;
    visibility: visible !important;
    overflow-y: auto;
    z-index: 1; /* Lower z-index as the sidebar container handles stacking */
  }

  .mobile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    background: white;
    z-index: 2;
  }

  .mobile-title {
    font-size: 1.125rem;
    font-weight: 500;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
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

  .nav-content {
    height: calc(100vh - 64px);
    overflow-y: auto;
    overflow-x: hidden;
    margin: 0;
    border-radius: 0;
    padding: 0 16px;
    box-sizing: border-box;
  }
}

.nav-section.nested {
  padding-left: 12px;
}

.nav-section.nested .nav-section-inner {
  border-left: 1px solid #e5e7eb;
  margin-left: 6px;
  padding-left: 6px;
}

.nav-section.nested .nav-item,
.nav-section.nested .nav-group-header {
  font-size: 13px;
}
</style>
