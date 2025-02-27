<template>
  <div class="action-bar">
    <div class="action-bar-container">
        <p class="create-branch-text">Create a branch to make changes</p>
      
      <div class="action-buttons">
        <button class="action-button create-branch">
          Create a branch
        </button>
        <button class="action-button see-branches" @click="navigateToBranches">
          See branches
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useGithub } from '~/composables/useGithub';
import { navigateTo } from '#app';

const { currentBranch, branches, switchBranch } = useGithub();

const handleBranchChange = async () => {
  try {
    await switchBranch(currentBranch.value);
  } catch (error) {
    console.error('Error switching branch:', error);
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 56px;
  display: flex;
  align-items: center;
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
</style> 