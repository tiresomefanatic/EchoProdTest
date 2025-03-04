<template>
  <div class="sidebar-wrapper" :class="{ 'is-mobile-open': isOpen }">
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
    >
      <!-- Mobile header -->
      <div class="mobile-header">
        <span class="mobile-title">ECHO Design Guidelines</span>
        <button class="close-btn" @click="closeMobileMenu" aria-label="Close menu">
          <span class="close-icon">×</span>
        </button>
      </div>

      <!-- Sidebar Header with Edit Toggle -->
      <div class="sidebar-header">
        <div class="header-actions">
          <button
            v-if="hasDraftChanges"
            class="commit-button"
            @click="handleCommitChanges"
            :disabled="isCommitting"
          >
            {{ isCommitting ? "Committing..." : "Commit Changes" }}
          </button>
          <button
            class="edit-toggle-btn"
            @click="handleToggleEditMode"
            :class="{ 'active': isEditMode }"
            aria-label="Toggle edit mode"
          >
            {{ isEditMode ? 'Done' : 'Edit' }}
          </button>
        </div>
      </div>

      <nav class="design-nav">
        <div class="nav-content">
          <template v-if="isLoading">
            <div class="loading-state">
              <div class="loading-spinner"></div>
              Loading navigation...
            </div>
          </template>

          <template v-else-if="navigationStructure && navigationStructure.length > 0">

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
                  'edit-mode': isEditMode,
                }"
                @click="!section.locked && !isEditMode && toggleSection(section.path)"
              >
                <div class="item-content">
                  {{ section.title }}
                  <template v-if="section.type === 'directory' && !isEditMode">
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

                <!-- Edit Mode Controls -->
                <div v-if="isEditMode && !section.locked" class="item-controls">
                  <!-- Up/Down arrows for reordering -->
                  <button 
                    class="item-control-btn up-btn" 
                    @click.stop="handleMoveItemUp(section.path)"
                    aria-label="Move item up"
                  >
                    ↑
                  </button>
                  <button 
                    class="item-control-btn down-btn" 
                    @click.stop="handleMoveItemDown(section.path)"
                    aria-label="Move item down"
                  >
                    ↓
                  </button>

                  <!-- Add new file button (for directories) -->
                  <button 
                    v-if="section.type === 'directory'" 
                    class="item-control-btn add-btn"
                    @click.stop="handleAddNewFile(section.path)"
                    aria-label="Add new file"
                  >
                    +
                  </button>
                </div>
              </div>

              <!-- Section Content -->
              <div
                v-if="section.type === 'directory'"
                class="nav-section"
                :class="{ collapsed: isCollapsed[section.path] && !isEditMode }"
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
                          'edit-mode': isEditMode,
                        }"
                        @click="!item.locked && !isEditMode && toggleSection(item.path)"
                      >
                        <div class="item-content">
                          {{ item.title }}
                          <span
                            v-if="!isEditMode"
                            class="chevron"
                            :class="{ rotated: !isCollapsed[item.path] }"
                            >›</span
                          >
                        </div>

                        <!-- Edit Mode Controls -->
                        <div v-if="isEditMode && !item.locked" class="item-controls">
                          <button 
                            class="item-control-btn up-btn" 
                            @click.stop="handleMoveItemUp(item.path)"
                            aria-label="Move item up"
                          >
                            ↑
                          </button>
                          <button 
                            class="item-control-btn down-btn" 
                            @click.stop="handleMoveItemDown(item.path)"
                            aria-label="Move item down"
                          >
                            ↓
                          </button>
                          <button 
                            class="item-control-btn add-btn"
                            @click.stop="handleAddNewFile(item.path)"
                            aria-label="Add new file"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div
                        class="nav-section nested"
                        :class="{ collapsed: isCollapsed[item.path] && !isEditMode }"
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
                                  'edit-mode': isEditMode,
                                }"
                                @click="!child.locked && !isEditMode && toggleSection(child.path)"
                              >
                                <div class="item-content">
                                  {{ child.title }}
                                  <span
                                    v-if="!isEditMode"
                                    class="chevron"
                                    :class="{ rotated: !isCollapsed[child.path] }"
                                    >›</span
                                  >
                                </div>

                                <!-- Edit Mode Controls -->
                                <div v-if="isEditMode && !child.locked" class="item-controls">
                                  <button 
                                    class="item-control-btn up-btn" 
                                    @click.stop="handleMoveItemUp(child.path)"
                                    aria-label="Move item up"
                                  >
                                    ↑
                                  </button>
                                  <button 
                                    class="item-control-btn down-btn" 
                                    @click.stop="handleMoveItemDown(child.path)"
                                    aria-label="Move item down"
                                  >
                                    ↓
                                  </button>
                                  <button 
                                    class="item-control-btn add-btn"
                                    @click.stop="handleAddNewFile(child.path)"
                                    aria-label="Add new file"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div
                                class="nav-section nested"
                                :class="{ collapsed: isCollapsed[child.path] && !isEditMode }"
                              >
                                <div class="nav-section-inner">
                                  <template
                                    v-for="grandChild in child.children"
                                    :key="grandChild.path"
                                  >
                                    <!-- Files within nested directory -->
                                    <div 
                                      v-if="grandChild.type === 'file'" 
                                      :class="{
                                        'nav-item sub-item': true,
                                        locked: grandChild.locked,
                                        'router-link-active': route.path === grandChild.path,
                                        'edit-mode': isEditMode,
                                      }"
                                    >
                                      <div class="item-content">
                                        <NuxtLink
                                          v-if="!grandChild.locked"
                                          :to="grandChild.path"
                                          @click="closeMobileMenu"
                                        >
                                          {{ grandChild.title }}
                                        </NuxtLink>
                                        <span v-else class="locked-item-content">
                                          {{ grandChild.title }}
                                          <img
                                            src="/lock-icon.svg"
                                            alt="Locked"
                                            class="lock-icon"
                                          />
                                        </span>
                                      </div>

                                      <!-- Edit Mode Controls for Files -->
                                      <div v-if="isEditMode && !grandChild.locked" class="item-controls">
                                        <button 
                                          class="item-control-btn up-btn" 
                                          @click.stop="handleMoveItemUp(grandChild.path)"
                                          aria-label="Move item up"
                                        >
                                          ↑
                                        </button>
                                        <button 
                                          class="item-control-btn down-btn" 
                                          @click.stop="handleMoveItemDown(grandChild.path)"
                                          aria-label="Move item down"
                                        >
                                          ↓
                                        </button>
                                      </div>
                                    </div>
                                  </template>
                                </div>
                              </div>
                            </template>

                            <!-- Files within directory -->
                            <div 
                              v-else-if="child.type === 'file'" 
                              :class="{
                                'nav-item sub-item': true,
                                locked: child.locked,
                                'router-link-active': route.path === child.path,
                                'edit-mode': isEditMode,
                              }"
                            >
                              <div class="item-content">
                                <NuxtLink
                                  v-if="!child.locked"
                                  :to="child.path"
                                  @click="closeMobileMenu"
                                >
                                  {{ child.title }}
                                </NuxtLink>
                                <span v-else class="locked-item-content">
                                  {{ child.title }}
                                  <img
                                    src="/lock-icon.svg"
                                    alt="Locked"
                                    class="lock-icon"
                                  />
                                </span>
                              </div>

                              <!-- Edit Mode Controls for Files -->
                              <div v-if="isEditMode && !child.locked" class="item-controls">
                                <button 
                                  class="item-control-btn up-btn" 
                                  @click.stop="handleMoveItemUp(child.path)"
                                  aria-label="Move item up"
                                >
                                  ↑
                                </button>
                                <button 
                                  class="item-control-btn down-btn" 
                                  @click.stop="handleMoveItemDown(child.path)"
                                  aria-label="Move item down"
                                >
                                  ↓
                                </button>
                              </div>
                            </div>
                          </template>
                        </div>
                      </div>
                    </template>

                    <!-- File Items (both locked and unlocked) -->
                    <div 
                      v-else-if="item.type === 'file'" 
                      :class="{
                        'nav-item sub-item': true,
                        locked: item.locked,
                        'router-link-active': route.path === item.path,
                        'edit-mode': isEditMode,
                      }"
                    >
                      <div class="item-content">
                        <NuxtLink
                          v-if="!item.locked"
                          :to="item.path"
                          @click="closeMobileMenu"
                        >
                          {{ item.title }}
                        </NuxtLink>
                        <span v-else class="locked-item-content">
                          {{ item.title }}
                          <img
                            src="/lock-icon.svg"
                            alt="Locked"
                            class="lock-icon"
                          />
                        </span>
                      </div>

                      <!-- Edit Mode Controls for Files -->
                      <div v-if="isEditMode && !item.locked" class="item-controls">
                        <button 
                          class="item-control-btn up-btn" 
                          @click.stop="handleMoveItemUp(item.path)"
                          aria-label="Move item up"
                        >
                          ↑
                        </button>
                        <button 
                          class="item-control-btn down-btn" 
                          @click.stop="handleMoveItemDown(item.path)"
                          aria-label="Move item down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <div v-if="isEditMode" class="nav-section-divider"></div>
            <!-- New Category Button (visible only in edit mode) -->
            <button 
              v-if="isEditMode" 
              class="new-category-btn"
              @click="handleAddNewFolder('/')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10.0013 18.3327C14.6037 18.3327 18.3346 14.6017 18.3346 9.99935C18.3346 5.39698 14.6037 1.66602 10.0013 1.66602C5.39893 1.66602 1.66797 5.39698 1.66797 9.99935C1.66797 14.6017 5.39893 18.3327 10.0013 18.3327Z" fill="#5377D4"/>
                <path d="M10 6.66699V13.3337" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6.66797 10H13.3346" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              New Category
            </button>
          </template>

          <template v-else>
            <div class="empty-state">
              <p>No navigation items found.</p>
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
    
    <!-- Modal Components -->
    <NewFileModal />
    <NewFolderModal />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useGithub } from "../composables/useGithub";
import { useEventBus } from '@vueuse/core';
import { useSidebarEditorStore } from "~/store/sidebarEditor";
import { useNavigationStore } from "~/store/navigation";
import { storeToRefs } from 'pinia';
import NewFileModal from "~/components/modals/NewFileModal.vue";
import NewFolderModal from "~/components/modals/NewFolderModal.vue";

const route = useRoute();
const isOpen = ref(false);
const isCollapsed = ref<Record<string, boolean>>({});
const isCommitting = ref(false);

// Direct store references
const navigationStore = useNavigationStore();
const { isLoading } = storeToRefs(navigationStore);
const { currentBranch } = useGithub();
const sidebarEditorStore = useSidebarEditorStore();

// Define a navigation structure directly from the store
const navigationStructure = computed(() => {
  console.log("Computing navigation structure in DesignSidebar");
  const branch = currentBranch.value;
  console.log("Current branch:", branch);
  
  // Access the structure directly
  if (!navigationStore.structures[branch]) {
    console.log("No structure found for branch:", branch);
    return [];
  }
  
  const structure = navigationStore.structures[branch].navigation;
  console.log("Found navigation structure:", structure);
  return structure;
});

// Computed properties
const isEditMode = computed(() => sidebarEditorStore.isEditMode);
const hasDraftChanges = computed(() => sidebarEditorStore.hasDraftChanges);

// Add a debug watcher
watch(navigationStructure, (newVal) => {
  console.log("Navigation structure changed:", newVal);
}, { deep: true });

// Check if a section is currently active
const isActiveSection = (sectionPath: string): boolean => {
  return route.path.startsWith(sectionPath);
};

// Toggle section collapse state
const toggleSection = (path: string) => {
  isCollapsed.value[path] = !isCollapsed.value[path];
};

// Define refresh logic instead of using the composable
const refreshNavigation = async (forceFetch = false) => {
  console.log("Refreshing navigation, force:", forceFetch);
  await navigationStore.fetchNavigation(forceFetch);
};

// Handle committing changes
const handleCommitChanges = async () => {
  if (isCommitting.value) return;
  
  isCommitting.value = true;
  try {
    await sidebarEditorStore.commitNavigationChanges();
  } finally {
    isCommitting.value = false;
  }
};

// Edit mode handlers
const handleToggleEditMode = () => {
  sidebarEditorStore.toggleEditMode();
  
  // When enabling edit mode, expand all sections
  if (sidebarEditorStore.isEditMode) {
    navigationStructure.value?.forEach((section) => {
      if (section.type === "directory") {
        isCollapsed.value[section.path] = false;
        // Also expand nested directories
        section.children?.forEach((child) => {
          if (child.type === "directory") {
            isCollapsed.value[child.path] = false;
            // And grandchildren directories
            child.children?.forEach((grandChild) => {
              if (grandChild.type === "directory") {
                isCollapsed.value[grandChild.path] = false;
              }
            });
          }
        });
      }
    });
  }
};

// Add new file handler
const handleAddNewFile = (parentPath: string) => {
  sidebarEditorStore.openNewFileModal(parentPath);
};

// Add new folder handler
const handleAddNewFolder = (parentPath: string) => {
  sidebarEditorStore.openNewFolderModal(parentPath);
};

// Move item up handler
const handleMoveItemUp = async (itemPath: string) => {
  await sidebarEditorStore.moveItemUp(itemPath);
};

// Move item down handler
const handleMoveItemDown = async (itemPath: string) => {
  await sidebarEditorStore.moveItemDown(itemPath);
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

// Mobile menu handlers
const toggleMobileMenu = () => {
  sidebarBus.emit(!isOpen.value);
};

const closeMobileMenu = () => {
  sidebarBus.emit(false);
};

// Watch for branch changes to refresh navigation
watch(currentBranch, async (newBranch) => {
  console.log("Branch changed to:", newBranch);
  await refreshNavigation(true);
});

// Watch route changes to expand current section
watch(
  () => route.path,
  (newPath) => {
    // Only adjust collapse state if not in edit mode
    if (!sidebarEditorStore.isEditMode) {
      // Find and expand all parent sections of the current route
      navigationStructure.value?.forEach((section) => {
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
    }
  },
  { immediate: true }
);

// Initial setup
onMounted(async () => {
  console.log("DesignSidebar mounted");
  
  // Set initial open state for desktop
  if (window.innerWidth > 1024) {
    isOpen.value = true;
    console.log("Setting initial desktop open state:", isOpen.value);
  }
  
  console.log("Starting initial navigation refresh");
  await refreshNavigation(true);
  console.log("After initial refresh - Navigation structure:", navigationStructure.value);
  
  // Add window resize handler
  if (process.client) {
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        isOpen.value = true;
      }
    });
  }
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
  background-color: #f5f5f5;
  border-radius: 12px;
}

.nav-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding-right: 8px;
  padding-left: 8px;
  padding-top: 8px;
}

/* Edit Mode Styles */
.sidebar-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 8px;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-toggle-btn {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
  color: #000;
}

.edit-toggle-btn.active {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

.commit-button {
  background-color: #4361ee;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
}

.commit-button:hover {
  background-color: #3651d4;
}

.commit-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.nav-section-divider {
  border-top: 1px solid #D7D7D7;
}

.new-category-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 12px;
  background-color: #f3f4f6;
  border-radius: 4px;
  margin: 0;
  width: 100%;
  cursor: pointer;
  gap: 8px;
  color: #000;
  font-family: "PP Neue Montreal";
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px; /* 150% */
  letter-spacing: 0.15px;
}

.item-content {
  display: flex;
  align-items: center;
  flex: 1;
  color: #000;
  font-family: "PP Neue Montreal";
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px; /* 150% */
  letter-spacing: 0.15px;
}

.locked-item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  color: #757575;
  font-family: "PP Neue Montreal";
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px; /* 150% */
  letter-spacing: 0.15px;
}

.lock-icon {
  width: 16px;
  height: 16px;
  margin-left: auto;
  flex-shrink: 0;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.item-control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 12px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
}

.item-control-btn:hover {
  background-color: #e5e7eb;
}

.add-btn {
  font-size: 14px;
  font-weight: bold;
}

.nav-group-header.edit-mode,
.nav-item.edit-mode {
  padding-right: 8px;
  padding-left: 8px;
  border-radius: 12px;
  background-color: rgba(243, 244, 246, 0.5);
}

.nav-group-header.edit-mode:hover,
.nav-item.edit-mode:hover {
  background-color: #d8d8d8;
}

.loading-state {
  padding: 1rem;
  text-align: center;
  color: #666;
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

.nav-item a {
  text-decoration: none;
  color: inherit;
  display: block;
  width: 100%;
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
    position: fixed;
    width: auto;
    height: 0;
    overflow: visible;
    z-index: 1001;
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
    height: calc(100vh - 120px); /* Account for header and edit buttons */
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
  padding-left: 6px;
}

.nav-section.nested .nav-item,
.nav-section.nested .nav-group-header {
  font-size: 13px;
}

.empty-state {
  padding: 1rem;
  text-align: center;
  color: #666;
}
</style>