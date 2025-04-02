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
    <aside class="design-sidebar" :class="{ 'is-mobile-open': isOpen }">
      <!-- Mobile header -->
      <div class="mobile-header">
        <span class="mobile-title">ECHO Guidelines</span>
        <button
          class="close-btn"
          @click="closeMobileMenu"
          aria-label="Close menu"
        >
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
            v-if="currentBranch !== 'main'"
            class="edit-toggle-btn"
            @click="handleToggleEditMode"
            :class="{ active: isEditMode }"
            aria-label="Toggle edit mode"
          >
            {{ isEditMode ? "Done" : "Edit" }}
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

          <template
            v-else-if="navigationStructure && navigationStructure.length > 0"
          >
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
                @click="
                  !section.locked && !isEditMode && toggleSection(section.path)
                "
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
                <div v-if="isEditMode" class="item-controls">
                  <!-- Up/Down arrows for reordering (only for unlocked items) -->
                  <button
                    v-if="!section.locked"
                    class="up-btn"
                    @click.stop="handleMoveItemUp(section.path)"
                    aria-label="Move item up"
                  >
                    ↑
                  </button>
                  <button
                    v-if="!section.locked"
                    class="down-btn"
                    @click.stop="handleMoveItemDown(section.path)"
                    aria-label="Move item down"
                  >
                    ↓
                  </button>
                  


                  <!-- Dropdown for directories - available for both locked and unlocked items -->
                  <div
                    v-if="section.type === 'directory'"
                    class="dropdown-container"
                  >
                    <button
                      class="dropdown-toggle"
                      @click.stop="toggleDropdown(section.path, $event)"
                      aria-label="Show more options"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
                          stroke="black"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z"
                          stroke="black"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z"
                          stroke="black"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
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
                        @click="
                          !item.locked &&
                            !isEditMode &&
                            toggleSection(item.path)
                        "
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
                        <div
                          v-if="isEditMode"
                          class="item-controls"
                        >
                          <button
                            v-if="!item.locked"
                            class="up-btn"
                            @click.stop="handleMoveItemUp(item.path)"
                            aria-label="Move item up"
                          >
                            ↑
                          </button>
                          <button
                            v-if="!item.locked"
                            class="down-btn"
                            @click.stop="handleMoveItemDown(item.path)"
                            aria-label="Move item down"
                          >
                            ↓
                          </button>
                          

                          <div class="dropdown-container">
                            <button
                              class="dropdown-toggle"
                              @click.stop="toggleDropdown(item.path, $event)"
                              aria-label="Show more options"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
                                  stroke="black"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                                <path
                                  d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z"
                                  stroke="black"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                                <path
                                  d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z"
                                  stroke="black"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div
                        class="nav-section nested"
                        :class="{
                          collapsed: isCollapsed[item.path] && !isEditMode,
                        }"
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
                                @click="
                                  !child.locked &&
                                    !isEditMode &&
                                    toggleSection(child.path)
                                "
                              >
                                <div class="item-content">
                                  {{ child.title }}
                                  <span
                                    v-if="!isEditMode"
                                    class="chevron"
                                    :class="{
                                      rotated: !isCollapsed[child.path],
                                    }"
                                    >›</span
                                  >
                                </div>

                                <!-- Edit Mode Controls -->
                                <div
                                  v-if="isEditMode && !child.locked"
                                  class="item-controls"
                                >
                                  <button
                                    class="up-btn"
                                    @click.stop="handleMoveItemUp(child.path)"
                                    aria-label="Move item up"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    class="down-btn"
                                    @click.stop="handleMoveItemDown(child.path)"
                                    aria-label="Move item down"
                                  >
                                    ↓
                                  </button>
                                  <div class="dropdown-container">
                                    <button
                                      class="dropdown-toggle"
                                      @click.stop="
                                        toggleDropdown(child.path, $event)
                                      "
                                      aria-label="Show more options"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                      >
                                        <path
                                          d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
                                          stroke="black"
                                          stroke-width="2"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                        />
                                        <path
                                          d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z"
                                          stroke="black"
                                          stroke-width="2"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                        />
                                        <path
                                          d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z"
                                          stroke="black"
                                          stroke-width="2"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div
                                class="nav-section nested"
                                :class="{
                                  collapsed:
                                    isCollapsed[child.path] && !isEditMode,
                                }"
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
                                        'router-link-active':
                                          route.path === grandChild.path,
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
                                        <span
                                          v-else
                                          class="locked-item-content"
                                        >
                                          {{ grandChild.title }}
                                          <img
                                            src="/lock-icon.svg"
                                            alt="Locked"
                                            class="lock-icon"
                                          />
                                        </span>
                                      </div>

                                      <!-- Edit Mode Controls for Files -->
                                      <div
                                        v-if="isEditMode && !grandChild.locked"
                                        class="item-controls"
                                      >
                                        <button
                                          class="up-btn"
                                          @click.stop="
                                            handleMoveItemUp(grandChild.path)
                                          "
                                          aria-label="Move item up"
                                        >
                                          ↑
                                        </button>
                                        <button
                                          class="down-btn"
                                          @click.stop="
                                            handleMoveItemDown(grandChild.path)
                                          "
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
                              <div
                                v-if="isEditMode"
                                class="item-controls"
                              >
                                <button
                                  v-if="!child.locked"
                                  class="up-btn"
                                  @click.stop="handleMoveItemUp(child.path)"
                                  aria-label="Move item up"
                                >
                                  ↑
                                </button>
                                <button
                                  v-if="!child.locked"
                                  class="down-btn"
                                  @click.stop="handleMoveItemDown(child.path)"
                                  aria-label="Move item down"
                                >
                                  ↓
                                </button>
                                <!-- Dropdown for files - available for both locked and unlocked items -->
                                <div class="dropdown-container">
                                  <button
                                    class="dropdown-toggle"
                                    @click.stop="toggleDropdown(child.path, $event)"
                                    aria-label="Show more options"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <path
                                        d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
                                        stroke="black"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                      />
                                      <path
                                        d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z"
                                        stroke="black"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                      />
                                      <path
                                        d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z"
                                        stroke="black"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                      />
                                    </svg>
                                  </button>
                                </div>
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
                      <div
                        v-if="isEditMode"
                        class="item-controls"
                      >
                        <button
                          v-if="!item.locked"
                          class="up-btn"
                          @click.stop="handleMoveItemUp(item.path)"
                          aria-label="Move item up"
                        >
                          ↑
                        </button>
                        <button
                          v-if="!item.locked"
                          class="down-btn"
                          @click.stop="handleMoveItemDown(item.path)"
                          aria-label="Move item down"
                        >
                          ↓
                        </button>
                        <!-- Dropdown for files - available for both locked and unlocked items -->
                        <div class="dropdown-container">
                          <button
                            class="dropdown-toggle"
                            @click.stop="toggleDropdown(item.path, $event)"
                            aria-label="Show more options"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
                                stroke="black"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z"
                                stroke="black"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z"
                                stroke="black"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M10.0013 18.3327C14.6037 18.3327 18.3346 14.6017 18.3346 9.99935C18.3346 5.39698 14.6037 1.66602 10.0013 1.66602C5.39893 1.66602 1.66797 5.39698 1.66797 9.99935C1.66797 14.6017 5.39893 18.3327 10.0013 18.3327Z"
                  fill="#5377D4"
                />
                <path
                  d="M10 6.66699V13.3337"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M6.66797 10H13.3346"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
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

    <Teleport to="body">
      <div
        v-if="activeDropdown"
        class="global-dropdown-menu"
        :style="{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
        }"
        @click.stop
      >
        <!-- Add File option - only for directories -->
        <button
          v-if="isItemDirectory(activeDropdown)"
          class="dropdown-item"
          @click.stop="handleAddNewFile(activeDropdown)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M8 3.33325V12.6666"
              stroke="black"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M3.33203 8H12.6654"
              stroke="black"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Add File
        </button>
        <!-- Add Folder option - only for directories -->
        <button
          v-if="isItemDirectory(activeDropdown)"
          class="dropdown-item"
          @click.stop="handleAddNewFolder(activeDropdown)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M14.6654 12.6667C14.6654 13.0203 14.5249 13.3594 14.2748 13.6095C14.0248 13.8595 13.6857 14 13.332 14H2.66536C2.31174 14 1.97261 13.8595 1.72256 13.6095C1.47251 13.3594 1.33203 13.0203 1.33203 12.6667V3.33333C1.33203 2.97971 1.47251 2.64057 1.72256 2.39052C1.97261 2.14048 2.31174 2 2.66536 2H5.9987L7.33203 4H13.332C13.6857 4 14.0248 4.14048 14.2748 4.39052C14.5249 4.64057 14.6654 4.97971 14.6654 5.33333V12.6667Z"
              stroke="black"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M8 7.33325V11.3333"
              stroke="black"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M6 9.33325H10"
              stroke="black"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Add Folder
        </button>
        <!-- Lock/Unlock toggle button - always available for all items -->
        <button
          class="dropdown-item"
          @click.stop="handleToggleLock(activeDropdown)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M12.6667 7.33333H3.33333C2.59695 7.33333 2 7.93028 2 8.66666V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V8.66666C14 7.93028 13.403 7.33333 12.6667 7.33333Z"
              stroke="black"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M4.66797 7.33333V4.66666C4.66797 3.78261 5.01916 2.93476 5.64428 2.30964C6.2694 1.68452 7.11725 1.33333 8.0013 1.33333C8.88536 1.33333 9.7332 1.68452 10.3583 2.30964C10.9834 2.93476 11.3346 3.78261 11.3346 4.66666V7.33333"
              stroke="black"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {{ isItemLocked(activeDropdown) ? 'Unlock' : 'Lock' }}
        </button>
        <button
          class="dropdown-item delete"
          @click.stop="handleDeleteItem(activeDropdown)"
          :disabled="isItemLocked(activeDropdown)"
          :class="{ 'disabled': isItemLocked(activeDropdown) }"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M2 4H3.33333H14"
              stroke="#E53935"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M5.33203 4.00065V2.66732C5.33203 2.31369 5.47251 1.97456 5.72256 1.72451C5.97261 1.47446 6.31174 1.33398 6.66536 1.33398H9.33203C9.68566 1.33398 10.0248 1.47446 10.2748 1.72451C10.5249 1.97456 10.6654 2.31369 10.6654 2.66732V4.00065M12.6654 4.00065V13.334C12.6654 13.6876 12.5249 14.0267 12.2748 14.2768C12.0248 14.5268 11.6857 14.6673 11.332 14.6673H4.66536C4.31174 14.6673 3.97261 14.5268 3.72256 14.2768C3.47251 14.0267 3.33203 13.6876 3.33203 13.334V4.00065H12.6654Z"
              stroke="#E53935"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Delete
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNavigationStore } from "~/store/navigation";
import { useSidebarEditorStore } from "~/store/sidebarEditor";
import { useToast, type ToastConfig } from "~/composables/useToast";
import { useGithub } from "../composables/useGithub";
import { useEventBus } from "@vueuse/core";
import { storeToRefs } from "pinia";
import NewFileModal from "~/components/modals/NewFileModal.vue";
import NewFolderModal from "~/components/modals/NewFolderModal.vue";

const route = useRoute();
const router = useRouter();
const isOpen = ref(false);
const isCollapsed = ref<Record<string, boolean>>({});
const isCommitting = ref(false);

// Direct store references
const navigationStore = useNavigationStore();
const { isLoading } = storeToRefs(navigationStore);
const { currentBranch } = useGithub();
const sidebarEditorStore = useSidebarEditorStore();

// Define a navigation structure directly from the store and filter based on current path
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
  
  // Determine which section we're in based on the current route
  const currentPath = route.path;
  console.log("Current path:", currentPath);
  
  // Filter the navigation structure based on the current path, regardless of edit mode
  if (currentPath.includes('/design')) {
    // Find the design folder
    const designFolder = structure.find(section => section.path.includes('/design') && section.type === 'directory');
    // Return only the children of the design folder if it exists
    return designFolder && designFolder.type === 'directory' ? designFolder.children : [];
  } else if (currentPath.includes('/develop')) {
    // Find the develop folder
    const developFolder = structure.find(section => section.path.includes('/develop') && section.type === 'directory');
    // Return only the children of the develop folder if it exists
    return developFolder && developFolder.type === 'directory' ? developFolder.children : [];
  } else if (currentPath.includes('/contribute')) {
    // Find the contribute folder
    const contributeFolder = structure.find(section => section.path.includes('/contribute') && section.type === 'directory');
    // Return only the children of the contribute folder if it exists
    return contributeFolder && contributeFolder.type === 'directory' ? contributeFolder.children : [];
  } else {
    // On the home page or other pages, show all sections
    return structure;
  }
});

// Computed properties
const isEditMode = computed(() => sidebarEditorStore.isEditMode);

// Determine the current section title based on the route
const currentSectionTitle = computed(() => {
  const currentPath = route.path;
  if (currentPath.includes('/design')) {
    return 'Design';
  } else if (currentPath.includes('/develop')) {
    return 'Develop';
  } else if (currentPath.includes('/contribute')) {
    return 'Contribute';
  } else {
    return 'Design'; // Default to Design on the home page
  }
});
const hasDraftChanges = computed(() => sidebarEditorStore.hasDraftChanges);

// Add a debug watcher
watch(
  navigationStructure,
  (newVal) => {
    console.log("Navigation structure changed:", newVal);
  },
  { deep: true }
);

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
const sidebarBus = useEventBus("sidebar-toggle");
const isFirstEvent = ref(true);

// Setup event listeners
sidebarBus.on(() => {
  console.log("Toggle event received, current state:", isOpen.value);
  if (isFirstEvent.value) {
    // Skip the first event that happens on component mount
    isFirstEvent.value = false;
    return;
  }

  // Process normal toggle for subsequent events
  toggleMobileMenu();
});

onMounted(() => {
  // Always start with sidebar closed on mobile
  if (process.client) {
    isOpen.value = false;
    
    // Ensure we check for branch changes and clear drafts when component mounts
    sidebarEditorStore.monitorBranchChanges();
  }

  refreshNavigation(true);

  // Add window resize handler
  if (process.client) {
    window.addEventListener("resize", () => {
      if (window.innerWidth < 1024) {
        // Close sidebar when in mobile view
        isOpen.value = false;
      }
    });
    
    // Also set up an interval to check periodically for draft clearing signals
    const checkInterval = setInterval(() => {
      sidebarEditorStore.monitorBranchChanges();
    }, 1000); // Check every second
    
    // Clean up interval on component unmount
    onUnmounted(() => {
      clearInterval(checkInterval);
    });
  }
});

// Mobile menu handlers - simplified
const toggleMobileMenu = () => {
  isOpen.value = !isOpen.value;

  // Apply body overflow style
  if (process.client) {
    document.body.style.overflow = isOpen.value ? "hidden" : "";
  }
};

const closeMobileMenu = () => {
  isOpen.value = false;

  // Apply body overflow style
  if (process.client) {
    document.body.style.overflow = "";
  }
};

// Watch for branch changes to refresh navigation and exit edit mode
watch(currentBranch, async (newBranch) => {
  console.log("Branch changed to:", newBranch);
  
  // Use the monitorBranchChanges method to handle edit mode exiting
  sidebarEditorStore.monitorBranchChanges();
  
  await refreshNavigation(true);
});

// Watch route changes to expand current section
watch(
  () => route.path,
  (newPath) => {
    // Only adjust collapse state if not in edit mode
    if (!sidebarEditorStore.isEditMode) {
      // Get the full navigation structure to find all sections
      const fullStructure = navigationStore.structures[currentBranch.value]?.navigation || [];
      
      // First, determine which main section we're in
      let mainSection;
      if (newPath.includes('/design')) {
        mainSection = fullStructure.find(section => section.path.includes('/design') && section.type === 'directory');
      } else if (newPath.includes('/develop')) {
        mainSection = fullStructure.find(section => section.path.includes('/develop') && section.type === 'directory');
      } else if (newPath.includes('/contribute')) {
        mainSection = fullStructure.find(section => section.path.includes('/contribute') && section.type === 'directory');
      }
      
      // If we found the main section, expand its children as needed
      if (mainSection) {
        mainSection.children?.forEach((item) => {
          if (item.type === "directory" && newPath.startsWith(item.path)) {
            isCollapsed.value[item.path] = false;
            // Also expand any nested directories
            item.children?.forEach((child) => {
              if (
                child.type === "directory" &&
                newPath.startsWith(child.path)
              ) {
                isCollapsed.value[child.path] = false;
              }
            });
          }
        });
      }
      
      // Also handle the current visible navigation structure
      navigationStructure.value?.forEach((section) => {
        if (section.type === "directory") {
          if (newPath.startsWith(section.path)) {
            isCollapsed.value[section.path] = false;
            // Also expand any nested directories
            section.children?.forEach((child) => {
              if (
                child.type === "directory" &&
                newPath.startsWith(child.path)
              ) {
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

const activeDropdown = ref<string | null>(null);
const dropdownPosition = ref({ top: 0, left: 0 });

const toggleDropdown = (path: string, event: MouseEvent) => {
  if (activeDropdown.value === path) {
    activeDropdown.value = null;
  } else {
    // Get position from the event target
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // Calculate position
    dropdownPosition.value = {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    };

    // Set the active dropdown
    activeDropdown.value = path;
  }

  // Stop event propagation
  event.stopPropagation();
};

// click handler to close the dropdown when clicking outside
onMounted(() => {
  if (process.client) {
    document.addEventListener("click", () => {
      activeDropdown.value = null;
    });
  }
});

// delete handler
const handleDeleteItem = async (itemPath: string) => {
  // Close the dropdown
  activeDropdown.value = null;

  // Get item information
  const item = findItemByPath(itemPath, navigationStructure.value);
  if (!item) {
    console.error("Item not found:", itemPath);
    return;
  }
  
  // Prevent deletion of locked items
  if (item.locked) {
    const { showToast } = useToast();
    showToast({
      title: "Cannot Delete",
      message: `This item is locked and cannot be deleted.`,
      type: "error",
    });
    return;
  }

  // Confirmation based on item type
  const confirmMessage = item.type === 'directory' 
    ? `Are you sure you want to delete the folder "${item.title}" and all its contents?` 
    : `Are you sure you want to delete the file "${item.title}"?`;

  // Show confirmation dialog
  const confirmed = window.confirm(confirmMessage);
  if (!confirmed) {
    return;
  }

  try {
    const sidebarEditorStore = useSidebarEditorStore();
    const { createNewContent, deleteContent } = useGithub();
    const { showToast } = useToast();
    const navigationStore = useNavigationStore();
    
    // Get current navigation structure (either from draft or current structure)
    let navigationData;
    const existingDraft = sidebarEditorStore.getDraftNavigationStructure();
    
    if (existingDraft) {
      navigationData = existingDraft;
    } else {
      // Use current structure and create a new object to avoid reference issues
      navigationData = {
        navigation: JSON.parse(JSON.stringify(navigationStore.getCurrentStructure))
      };
    }

    // Function to remove an item from navigation structure
    const removeItemFromNavigation = (items, path) => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].path === path) {
          // Found the item to remove
          items.splice(i, 1);
          return true;
        }
        if (items[i].type === 'directory' && items[i].children) {
          if (removeItemFromNavigation(items[i].children, path)) {
            return true;
          }
        }
      }
      return false;
    };

    // If item is a directory, we need to delete all files within it recursively
    if (item.type === 'directory') {
      // Get all paths to delete (the directory and all its children)
      const pathsToDelete = [];
      const contentPathsToDelete = [];
      
      const collectPaths = (item) => {
        pathsToDelete.push(item.path);
        
        // Convert navigation path to actual content path
        // Navigation paths look like: /design/foundation/color
        // Content paths look like: content/design/foundation/color.md
        if (item.type === 'file') {
          const contentPath = `content${item.path}.md`;
          contentPathsToDelete.push(contentPath);
        } else if (item.type === 'directory') {
          // For a directory, add the directory path
          const contentDirPath = `content${item.path}`;
          contentPathsToDelete.push(contentDirPath);
          
          // Process all children
          if (item.children) {
            item.children.forEach(child => collectPaths(child));
          }
        }
      };
      
      collectPaths(item);
      
      // Delete all collected paths from navigation structure
      let deletedCount = 0;
      for (const pathToDelete of pathsToDelete) {
        if (removeItemFromNavigation(navigationData.navigation, pathToDelete)) {
          deletedCount++;
        }
      }
      
      console.log(`Deleted ${deletedCount} items from navigation structure`);
      
      // Now delete the actual files and directories
      for (const contentPath of contentPathsToDelete) {
        try {
          await deleteContent(contentPath);
          console.log(`Deleted file/directory: ${contentPath}`);
        } catch (error) {
          console.error(`Error deleting ${contentPath}:`, error);
          // Continue with other deletions even if one fails
        }
      }
    } else {
      // Simple file deletion
      if (!removeItemFromNavigation(navigationData.navigation, itemPath)) {
        throw new Error(`Could not find item at path: ${itemPath} in navigation structure`);
      }
      
      // Delete the actual file
      try {
        // Convert navigation path to content path
        const contentPath = `content${itemPath}.md`;
        await deleteContent(contentPath);
        console.log(`Deleted file: ${contentPath}`);
      } catch (error) {
        console.error(`Error deleting file:`, error);
        throw error;
      }
    }
    
    // Save to draft
    sidebarEditorStore.saveDraftNavigationStructure(navigationData);
    
    // Update the navigation store to use the draft
    navigationStore.applyDraft(navigationData);
    
    showToast({
      title: "Success",
      message: item.type === 'directory' 
        ? `Folder "${item.title}" and its contents deleted (draft saved)` 
        : `File "${item.title}" deleted (draft saved)`,
      type: "success",
    });
    
    // Navigate to appropriate page
    const currentPath = route.path;
    
    // Helper function to get parent path
    const getParentPath = (path) => {
      // Remove trailing slash if present
      const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
      // Get the parent path by removing the last segment
      const lastSlashIndex = cleanPath.lastIndexOf('/');
      if (lastSlashIndex <= 0) {
        // If at root level or no slash found, go to homepage
        return '/';
      }
      return cleanPath.substring(0, lastSlashIndex);
    };
    
    // Check if we're currently on the deleted item's page or one of its children
    if (currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)) {
      // We're deleting the current page or a parent of the current page, navigate to parent
      const parentPath = getParentPath(itemPath);
      
      // Determine the target path - if parent is a directory, append '/index'
      let targetPath = parentPath;
      const parentItem = findItemByPath(parentPath, navigationStructure.value);
      
      if (parentItem && parentItem.type === 'directory') {
        // For top-level directories like '/design', navigate to their index
        targetPath = `${parentPath}/index`;
      }
      
      console.log(`Navigating from ${currentPath} to ${targetPath}`);
      router.push(targetPath);
    }
  } catch (error) {
    console.error("Error deleting item:", error);
    const { showToast } = useToast();
    showToast({
      title: "Error",
      message: `Failed to delete item: ${error.message}`,
      type: "error",
    });
  }
};

// Helper function to recursively find an item by path
const findItemByPath = (itemPath: string, items) => {
  if (!items) return null;
  
  for (const item of items) {
    if (item.path === itemPath) {
      return item;
    }
    if (item.type === 'directory' && item.children) {
      const found = findItemByPath(itemPath, item.children);
      if (found) return found;
    }
  }
  return null;
};

// Check if an item is locked
const isItemLocked = (itemPath: string): boolean => {
  if (!itemPath) return false;
  
  // Find the item in the navigation structure
  const item = findItemByPath(itemPath, navigationStructure.value);
  return item ? item.locked : false;
};

// Check if an item is a directory
const isItemDirectory = (itemPath: string): boolean => {
  if (!itemPath) return false;
  
  // Find the item in the navigation structure
  const item = findItemByPath(itemPath, navigationStructure.value);
  return item ? item.type === 'directory' : false;
};

// Lock/unlock handler
const handleToggleLock = (itemPath: string) => {
  const navigationStore = useNavigationStore();
  const toast = useToast();
  
  // Toggle lock status in the navigation structure
  const success = navigationStore.toggleLock(itemPath);
  
  if (success) {
    // Update hasDraftChanges in sidebarEditorStore
    const sidebarEditorStore = useSidebarEditorStore();
    sidebarEditorStore.hasDraftChanges = true;
    
    // Close the dropdown menu
    activeDropdown.value = null;
    
    // Show success toast
    toast.showToast({
      title: "Success",
      message: "Lock status updated (draft saved)",
      type: "success",
    });
  } else {
    // Show error toast
    toast.showToast({
      title: "Error",
      message: "Failed to update lock status",
      type: "error",
    });
  }
};
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
  padding-bottom: 8px;
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
  border-top: 1px solid #d7d7d7;
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
  gap: 8px;
  margin-left: auto;
}

.up-btn,
.down-btn,
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  cursor: pointer;
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
}

.nav-group-header {
  display: flex;
  height: 40px;
  padding: 12px 0;
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
  height: 40px;
  padding: 12px 0;
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
  color: #303030;
  font-family: "PP Neue Montreal";
  font-size: 16px;
  font-style: normal;
  font-weight: 530 !important;
  line-height: 24px; /* 150% */
  letter-spacing: 0.15px;
  /* Removed background color */
  width: 100%;
  box-sizing: border-box;
  padding-right: 8px;
  padding-left: 16px;
}

.nav-item.router-link-active .item-content,
.nav-item.router-link-active .item-content a,
.nav-item.router-link-active a {
  color: #303030;
  font-family: "PP Neue Montreal";
  font-size: 16px;
  font-style: normal;
  font-weight: 530 !important;
  line-height: 24px; /* 150% */
  letter-spacing: 0.15px;
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

.nav-item.locked .item-content,
.nav-group-header.locked .item-content {
  color: #999;
  cursor: not-allowed;
  pointer-events: none;
}

.nav-item.locked,
.nav-group-header.locked {
  color: #999;
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

.dropdown-container {
  position: relative;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
}

.dropdown-toggle svg {
  width: 16px;
  height: 16px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 75%;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 9999 !important;
  min-width: 120px;
  overflow: hidden;
  transform: translateZ(0);
  isolation: isolate;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  width: 100%;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  z-index: 1002even afte !important;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-item:disabled,
.dropdown-item.disabled:hover {
  background-color: transparent;
}

.dropdown-item.delete {
  color: #e53935;
}

.dropdown-item.delete.disabled {
  color: #ccc;
  cursor: not-allowed;
  opacity: 0.5;
}

.dropdown-item.delete.disabled svg path {
  stroke: #ccc;
}

.dropdown-item.delete:hover {
  background-color: #ffebee;
}

.global-dropdown-menu {
  position: absolute;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 99999;
  min-width: 120px;
  overflow: hidden;
  filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.15));
}

.global-dropdown-menu .dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  width: 100%;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.global-dropdown-menu .dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-item:disabled,
.dropdown-item.disabled:hover {
  background-color: transparent;
}



.global-dropdown-menu .dropdown-item.delete {
  color: #e53935;
}

.dropdown-item.delete.disabled {
  color: #ccc;
  cursor: not-allowed;
  opacity: 0.5;
}

.dropdown-item.delete.disabled svg path {
  stroke: #ccc;
}



.global-dropdown-menu .dropdown-item.delete:hover {
  background-color: #ffebee;
}
</style>
