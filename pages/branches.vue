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
        <div class="branches-header">
          <h1 class="branches-title">Git Branches</h1>
          <button class="create-branch-button" @click="showCreateBranchModal = true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a.75.75 0 01.75.75v6.5h6.5a.75.75 0 010 1.5h-6.5v6.5a.75.75 0 01-1.5 0v-6.5h-6.5a.75.75 0 010-1.5h6.5v-6.5A.75.75 0 018 0z"></path>
            </svg>
            Create Branch
          </button>
        </div>
        
        <div class="branches-list">
          <div v-if="loading" class="loading-state">
            Loading branches...
          </div>
          <div v-else-if="branches.length === 0" class="empty-state">
            No branches found
          </div>
          <div v-else>
            <div 
              v-for="(branch, index) in branches" 
              :key="index" 
              class="branch-item"
              :class="{ 'active': branch === currentBranch }"
            >
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
                <div v-if="branch === currentBranch" class="current-branch-badge">Current</div>
              </div>
              <div class="branch-actions">
                <button 
                  v-if="branch !== currentBranch" 
                  class="switch-branch-button" 
                  @click="handleSwitchBranch(branch)"
                  :disabled="isSwitchingBranch"
                >
                  Switch to branch
                </button>
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
      
      <!-- Branch creation modal -->
      <div v-if="showCreateBranchModal" class="modal-overlay" @click.self="showCreateBranchModal = false">
        <div class="modal-content">
          <h3 class="modal-title">Create a new branch</h3>
          <p class="modal-description">Create a new branch from {{ currentBranch }}</p>
          
          <div class="branch-form">
            <label for="branch-name">Branch name</label>
            <input 
              id="branch-name" 
              v-model="newBranchName" 
              type="text" 
              placeholder="feature/my-new-branch"
              :class="{ 'error': branchNameError }"
            />
            <p v-if="branchNameError" class="error-message">{{ branchNameError }}</p>
          </div>
          
          <div class="modal-actions">
            <button class="cancel-button" @click="showCreateBranchModal = false">Cancel</button>
            <button 
              class="create-button" 
              @click="handleCreateBranch" 
              :disabled="isCreatingBranch || !newBranchName || !!branchNameError"
            >
              <span v-if="isCreatingBranch">Creating...</span>
              <span v-else>Create branch</span>
            </button>
          </div>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useGithub } from '~/composables/useGithub';
import { useRouter } from 'vue-router';
import { useToast } from '~/composables/useToast';
import { useEditorStore } from '~/store/editor';
import { useNavigation } from '~/composables/useNavigation';

const router = useRouter();
const { branches, fetchBranches, currentBranch, switchBranch, createBranch } = useGithub();
const { showToast } = useToast();
const editorStore = useEditorStore();
const { refreshNavigation } = useNavigation();

// State
const loading = ref(true);
const activeMenu = ref(null);
const isSwitchingBranch = ref(false);
const showCreateBranchModal = ref(false);
const newBranchName = ref('');
const isCreatingBranch = ref(false);
const branchNameError = ref('');

// Watch for branch name changes to validate
watch(newBranchName, (value) => {
  if (!value) {
    branchNameError.value = '';
    return;
  }
  
  // Basic branch name validation
  if (!/^[a-zA-Z0-9_\-\/]+$/.test(value)) {
    branchNameError.value = 'Branch name can only contain letters, numbers, hyphens, underscores, and slashes';
  } else if (branches.value.includes(value)) {
    branchNameError.value = 'A branch with this name already exists';
  } else {
    branchNameError.value = '';
  }
});

// Handle branch creation
const handleCreateBranch = async () => {
  if (!newBranchName.value || branchNameError.value) {
    return;
  }
  
  isCreatingBranch.value = true;
  
  try {
    const result = await createBranch(newBranchName.value);
    if (result) {
      showToast({
        title: 'Success',
        message: `Branch "${newBranchName.value}" created successfully`,
        type: 'success'
      });
      showCreateBranchModal.value = false;
      newBranchName.value = '';
      
      // Switch to the new branch
      await handleSwitchBranch(newBranchName.value);
    }
  } catch (error) {
    console.error('Error creating branch:', error);
    showToast({
      title: 'Error',
      message: `Failed to create branch: ${error.message || 'Unknown error'}`,
      type: 'error'
    });
  } finally {
    isCreatingBranch.value = false;
  }
};

onMounted(async () => {
  try {
    await fetchBranches();
  } catch (error) {
    console.error('Error fetching branches:', error);
    showToast({
      title: 'Error',
      message: 'Failed to fetch branches',
      type: 'error'
    });
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

// Handle switching branches
const handleSwitchBranch = async (branchName) => {
  if (branchName === currentBranch.value || isSwitchingBranch.value) {
    return;
  }

  isSwitchingBranch.value = true;
  
  try {
    // Clear drafts for the current path if necessary
    // This is a simplified version - in a real app you might want to save drafts
    
    // Switch branch
    await switchBranch(branchName);
    
    // Update navigation to reflect new branch content
    await refreshNavigation();
    
    showToast({
      title: 'Branch Switched',
      message: `Successfully switched to branch "${branchName}"`,
      type: 'success'
    });
    
    // Navigate back to the previous page instead of home
    router.back();
  } catch (error) {
    console.error('Error switching branch:', error);
    showToast({
      title: 'Error',
      message: `Failed to switch to branch "${branchName}"`,
      type: 'error'
    });
  } finally {
    isSwitchingBranch.value = false;
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
  justify-content: space-between;
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
  margin: 0;
}

.create-branch-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #FFFFFF;
  background-color: #4361EE;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.create-branch-button:hover {
  background-color: #3651D4;
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
  transition: background-color 0.2s;
}

.branch-item:hover {
  background-color: #F9FAFB;
}

.branch-item.active {
  background-color: #EFF6FF;
}

.branch-icon {
  margin-right: 16px;
}

.branch-details {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.branch-name {
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 530;
  font-size: 14px;
  line-height: 24px;
  letter-spacing: 0.15px;
  color: #000000;
}

.current-branch-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background-color: #10B981;
  color: white;
  font-family: "PP Neue Montreal", sans-serif;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
}

.branch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  margin-left: auto;
}

.switch-branch-button {
  padding: 6px 12px;
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #FFFFFF;
  background-color: #4361EE;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.switch-branch-button:hover:not(:disabled) {
  background-color: #3651D4;
}

.switch-branch-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.modal-title {
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 600;
  font-size: 20px;
  margin-top: 0;
  margin-bottom: 8px;
  color: #111827;
}

.modal-description {
  font-family: "PP Neue Montreal", sans-serif;
  font-size: 14px;
  margin-bottom: 24px;
  color: #6B7280;
}

.branch-form {
  margin-bottom: 24px;
}

.branch-form label {
  display: block;
  font-family: "PP Neue Montreal", sans-serif;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.branch-form input {
  width: 100%;
  padding: 10px 12px;
  font-family: "PP Neue Montreal", sans-serif;
  font-size: 14px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background-color: #F9FAFB;
}

.branch-form input:focus {
  outline: none;
  border-color: #4361EE;
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.1);
}

.branch-form input.error {
  border-color: #EF4444;
}

.error-message {
  color: #EF4444;
  font-size: 12px;
  margin-top: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-button {
  padding: 10px 16px;
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #374151;
  background-color: #F3F4F6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background-color: #E5E7EB;
}

.create-button {
  padding: 10px 16px;
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #FFFFFF;
  background-color: #4361EE;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.create-button:hover:not(:disabled) {
  background-color: #3651D4;
}

.create-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style> 