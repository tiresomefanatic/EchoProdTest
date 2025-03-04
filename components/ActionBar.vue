<template>
  <div class="action-bar">
    <div class="action-bar-container">
      <div class="left-section">
        <!-- Branch info display -->
        <div v-if="currentBranch" class="branch-info">
          <div class="branch-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.75 2.5C14.1642 2.5 14.5 2.83579 14.5 3.25V4.16667H15.4167C15.8309 4.16667 16.1667 4.50246 16.1667 4.91667C16.1667 5.33088 15.8309 5.66667 15.4167 5.66667H14.5V6.58333C14.5 6.99755 14.1642 7.33333 13.75 7.33333C13.3358 7.33333 13 6.99755 13 6.58333V5.66667H12.0833C11.6691 5.66667 11.3333 5.33088 11.3333 4.91667C11.3333 4.50246 11.6691 4.16667 12.0833 4.16667H13V3.25C13 2.83579 13.3358 2.5 13.75 2.5Z" fill="white"/>
              <path d="M6.25 2.5C6.66421 2.5 7 2.83579 7 3.25V4.16667H7.91667C8.33088 4.16667 8.66667 4.50246 8.66667 4.91667C8.66667 5.33088 8.33088 5.66667 7.91667 5.66667H7V6.58333C7 6.99755 6.66421 7.33333 6.25 7.33333C5.83579 7.33333 5.5 6.99755 5.5 6.58333V5.66667H4.58333C4.16912 5.66667 3.83333 5.33088 3.83333 4.91667C3.83333 4.50246 4.16912 4.16667 4.58333 4.16667H5.5V3.25C5.5 2.83579 5.83579 2.5 6.25 2.5Z" fill="white"/>
              <path d="M6.25 17.5C6.66421 17.5 7 17.1642 7 16.75V15.8333H7.91667C8.33088 15.8333 8.66667 15.4975 8.66667 15.0833C8.66667 14.6691 8.33088 14.3333 7.91667 14.3333H7V13.4167C7 13.0024 6.66421 12.6667 6.25 12.6667C5.83579 12.6667 5.5 13.0024 5.5 13.4167V14.3333H4.58333C4.16912 14.3333 3.83333 14.6691 3.83333 15.0833C3.83333 15.4975 4.16912 15.8333 4.58333 15.8333H5.5V16.75C5.5 17.1642 5.83579 17.5 6.25 17.5Z" fill="white"/>
              <path d="M13.75 17.5C14.1642 17.5 14.5 17.1642 14.5 16.75V15.8333H15.4167C15.8309 15.8333 16.1667 15.4975 16.1667 15.0833C16.1667 14.6691 15.8309 14.3333 15.4167 14.3333H14.5V13.4167C14.5 13.0024 14.1642 12.6667 13.75 12.6667C13.3358 12.6667 13 13.0024 13 13.4167V14.3333H12.0833C11.6691 14.3333 11.3333 14.6691 11.3333 15.0833C11.3333 15.4975 11.6691 15.8333 12.0833 15.8333H13V16.75C13 17.1642 13.3358 17.5 13.75 17.5Z" fill="white"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M10 7.5C10.6903 7.5 11.25 8.05964 11.25 8.75C11.25 9.44036 10.6903 10 10 10C9.30964 10 8.75 9.44036 8.75 8.75C8.75 8.05964 9.30964 7.5 10 7.5ZM10 12.5C10.6903 12.5 11.25 11.9404 11.25 11.25C11.25 10.5596 10.6903 10 10 10C9.30964 10 8.75 10.5596 8.75 11.25C8.75 11.9404 9.30964 12.5 10 12.5Z" fill="white"/>
            </svg>
          </div>
          <span class="branch-name">{{ currentBranch }}</span>
          <span v-if="contentSourceClass" class="content-status" :class="contentSourceClass">
            {{ contentSource }}
          </span>
        </div>
        <p v-else class="create-branch-text">Create a branch to make changes</p>
      </div>
      
      <div class="action-buttons">
        <button class="action-button create-branch" @click="showBranchModal = true">
          Create a branch
        </button>
        <button class="action-button see-branches" @click="navigateToBranches">
          See branches
        </button>
        <!-- Request review button -->
        <button class="request-review-button" @click="handleRequestReview">
          Request review
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
import { useEditorStore } from '~/store/editor';

const { currentBranch, branches, switchBranch, createBranch } = useGithub();
const { showToast } = useToast();
const editorStore = useEditorStore();

// Props to receive content path and status from parent
const props = defineProps({
  contentPath: {
    type: String,
    default: ''
  },
  contentSource: {
    type: String,
    default: ''
  },
  contentSourceClass: {
    type: String,
    default: ''
  },
  isEditing: {
    type: Boolean,
    default: false
  }
});

// Emit events
const emit = defineEmits(['requestReview']);

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

// Handle request review button click
const handleRequestReview = () => {
  emit('requestReview');
};
</script>

<style scoped>
.action-bar {
  background-color: #262626;
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
  width: 100%;
}

.left-section {
  display: flex;
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
  color: #FFFFFF;
}

.branch-icon {
  display: flex;
  align-items: center;
}

.branch-name {
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 530;
  font-size: 14px;
  line-height: 24px;
  letter-spacing: 0.15px;
  color: #FFFFFF;
}

.content-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 8px;
}

.content-status.draft {
  background-color: #FCD34D;
  color: #78350F;
}

.content-status.committed {
  background-color: #10B981;
  color: #FFFFFF;
}

.content-status.new {
  background-color: #60A5FA;
  color: #FFFFFF;
}

.branch-label {
  font-size: 14px;
  color: #FFFFFF;
}

.branch-select {
  padding: 5px 12px;
  font-size: 14px;
  color: #FFFFFF;
  background-color: #5377D4;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  cursor: pointer;
  min-width: 160px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-button {
  padding: 8px 12px;
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 530;
  font-size: 14px;
  line-height: 24px;
  color: #FFFFFF;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  max-height: 40px;
}

/* Review button styling */
.review-button {
  background-color: white;
  color: #4361EE;
  border: none;
}

.review-button:hover {
  background-color: #f3f4f6;
}

/* Added media query for responsiveness */
@media (max-width: 767px) {
  .action-button {
    padding: 4px 8px;
    font-size: 12px;
    max-height: 40px;
  }
  
  .branch-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

/* styling for the request review button */
.request-review-button {
  width: 129px;
  height: 35px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.40);
  background-color: transparent;
  color: #FFF;
  font-family: "PP Neue Montreal";
  font-size: 14px;
  font-style: normal;
  font-weight: 530;
  line-height: 24px;
  letter-spacing: 0.15px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.request-review-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style> 