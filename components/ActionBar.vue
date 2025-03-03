<template>
  <div class="action-bar">
    <div class="action-bar-container">
        <p class="create-branch-text">Create a branch to make changes</p>
      
      <div class="action-buttons">
        <button class="action-button create-branch" @click="showBranchModal = true">
          Create a branch
        </button>
        <button class="action-button see-branches" @click="navigateToBranches">
          See branches
        </button>
      </div>
    </div>

    <!-- Branch creation modal -->
    <div v-if="showBranchModal" class="modal-overlay" @click.self="showBranchModal = false">
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
          <button class="cancel-button" @click="showBranchModal = false">Cancel</button>
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
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useGithub } from '~/composables/useGithub';
import { navigateTo } from '#app';
import { useToast } from '~/composables/useToast';

const { currentBranch, branches, switchBranch, createBranch } = useGithub();
const { showToast } = useToast();

// Modal state
const showBranchModal = ref(false);
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
      showBranchModal.value = false;
      newBranchName.value = '';
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

const navigateToBranches = () => {
  navigateTo('/branches');
};
</script>

<style scoped>
.action-bar {
  background-color: #5377D4;
  width: 100%;
  position: relative;
  height: 56px;
  display: flex;
  align-items: center;
  z-index: 100;
}

.action-bar-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.create-branch-text {
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 530;
  font-size: 14px;
  line-height: 24px;
  letter-spacing: 0.15px;
  color: #FFFFFF; 
  margin-right: 16px;
}

.branch-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.branch-label {
  font-size: 14px;
  color: #FFFFFF; /* White text color */
}

.branch-select {
  padding: 5px 12px;
  font-size: 14px;
  color: #FFFFFF; /* White text color */
  background-color: #5377D4; /* Match action bar */
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  cursor: pointer;
  min-width: 160px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 8px 12px;
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 530;
  font-size: 14px;
  line-height: 24px;
  color: #FFFFFF; /* White text color */
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  max-height: 40px;
}

/* Added media query for responsiveness */
@media (max-width: 767px) {
  .action-button {
    padding: 4px 8px; /* Increased padding for better touch targets */
    font-size: 12px; /* Slightly larger font size for readability */
    max-height: 40px;
  }
}

.action-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
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