<template>
  <div class="branches-page">
    <ClientOnly>
      <button class="back-button" @click="goBack">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z"></path>
        </svg>
        Go back
      </button>
      
      <div class="branches-container">
        
        <div class="branches-list">
          <div v-if="loading" class="loading-state">
            Loading branches...
          </div>
          <div v-else-if="branches.length === 0" class="empty-state">
            No branches found
          </div>
          <div v-else>
            <div v-for="(branch, index) in branches" :key="index" class="branch-item">
              <div class="branch-icon">
                
                <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="28" height="32" rx="6" fill="#5377D4"/>
                <path d="M8 7V19" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 13C21.6569 13 23 11.6569 23 10C23 8.34315 21.6569 7 20 7C18.3431 7 17 8.34315 17 10C17 11.6569 18.3431 13 20 13Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 25C9.65685 25 11 23.6569 11 22C11 20.3431 9.65685 19 8 19C6.34315 19 5 20.3431 5 22C5 23.6569 6.34315 25 8 25Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 13C20 15.3869 19.0518 17.6761 17.364 19.364C15.6761 21.0518 13.3869 22 11 22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="branch-details">
                <div class="branch-name">{{ branch }}</div>
                <div class="branch-date">Last edited on: 22 Feb, 2025</div>
              </div>
              <div class="branch-actions">
                <button class="action-menu-button" @click="toggleMenu(index)">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="#000000">
                    <path d="M8 1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM8 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM8 11.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"></path>
                  </svg>
                </button>
                <div v-if="activeMenu === index" class="menu-dropdown">
                  <div class="menu-option">Duplicate</div>
                  <div class="menu-divider"></div>
                  <div class="menu-option delete">Delete</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useGithub } from '~/composables/useGithub';
import { useRouter } from 'vue-router';

const router = useRouter();
const { branches, fetchBranches } = useGithub();
const loading = ref(true);
const activeMenu = ref(null);

onMounted(async () => {
  try {
    await fetchBranches();
  } catch (error) {
    console.error('Error fetching branches:', error);
  } finally {
    loading.value = false;
  }
});

const goBack = () => {
  router.back();
};

const toggleMenu = (index) => {
  if (activeMenu.value === index) {
    activeMenu.value = null;
  } else {
    activeMenu.value = index;
  }
};

// Close menu when clicking outside
const closeMenuOnOutsideClick = (event) => {
  if (activeMenu.value !== null && !event.target.closest('.branch-actions')) {
    activeMenu.value = null;
  }
};

onMounted(() => {
  document.addEventListener('click', closeMenuOnOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnOutsideClick);
});
</script>

<style scoped>
.branches-page {
  min-height: 100vh;
  background-color: #FFFFFF;
  position: relative;
}

.back-button {
  position: absolute;
  top: 11px;
  left: 27px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 114px;
  height: 35px;
  padding: 8px 12px;
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 530;
  font-size: 14px;
  line-height: 24px;
  color: #374151;
  background-color: #F3F4F6;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  z-index: 10;
}

.back-button:hover {
  background-color: #E5E7EB;
}

.branches-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 80px 16px 32px;
}

.branches-header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E5E7EB;
}

.branches-title {
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 600;
  font-size: 24px;
  line-height: 32px;
  color: #111827;
}

.branches-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.branch-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #DEDEDE;
  position: relative;
}

.branch-icon {
  margin-right: 16px;
}

.branch-details {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.branch-name {
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 530;
  font-size: 14px;
  line-height: 24px;
  letter-spacing: 0.15px;
  color: #000000;
  text-align: left;
}

.branch-date {
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 530;
  font-size: 14px;
  line-height: 24px;
  letter-spacing: 0.15px;
  color: #000000;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.branch-actions {
  display: flex;
  align-items: center;
  position: relative;
  margin-left: auto;
}

.action-menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #6B7280;
}

.action-menu-button:hover {
  background-color: #F3F4F6;
  color: #111827;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 160px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: hidden;
}

.menu-option {
  padding: 12px 16px;
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 530;
  font-size: 16px;
  line-height: 18px;
  letter-spacing: 0.15px;
  color: #111827;
  cursor: pointer;
}

.menu-option:hover {
  background-color: #F3F4F6;
}

.menu-option.delete {
  color: #EF4444;
}

.menu-divider {
  height: 0.5px;
  background-color: #C7C6C6;
  margin: 0;
}

.loading-state, .empty-state {
  padding: 32px;
  text-align: center;
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: #6B7280;
}
</style> 