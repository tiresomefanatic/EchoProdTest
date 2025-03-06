<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleClose">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">Commit Changes</h3>
        <button class="modal-close" @click="handleClose" aria-label="Close modal">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label for="commit-message" class="form-label">Commit message</label>
          <textarea 
            id="commit-message" 
            v-model="commitMessage" 
            class="form-input" 
            placeholder="Describe your changes..."
            rows="4"
            @keydown.ctrl.enter="handleSubmit"
            @keydown.meta.enter="handleSubmit"
          ></textarea>
          <p class="form-help">Briefly describe what you changed. Press Ctrl+Enter or ⌘+Enter to quickly commit.</p>
        </div>
      </div>
      
      <div class="modal-footer">
        <button 
          class="secondary-button" 
          @click="handleClose"
          tabindex="0"
          aria-label="Cancel commit"
        >
          Cancel
        </button>
        <button 
          class="primary-button" 
          @click="handleSubmit"
          :disabled="!commitMessage.trim()"
          tabindex="0"
          aria-label="Submit commit"
        >
          Commit Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

interface Props {
  isOpen: boolean;
  filePath: string;
  content: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'commit', message: string): void;
}>();

// Local state
const commitMessage = ref('');

// Reset form when modal is opened
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    commitMessage.value = '';
  }
});

// Handle keyboard events
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    handleClose();
  }
};

// Close the modal
const handleClose = () => {
  emit('close');
};

// Submit the commit
const handleSubmit = () => {
  if (commitMessage.value.trim()) {
    emit('commit', commitMessage.value);
    handleClose();
  }
};

// Setup event listeners for keyboard shortcuts
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
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
  z-index: 9999;
}

.modal-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-family: "PP Neue Montreal", sans-serif;
  font-weight: 600;
  font-size: 20px;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.modal-close:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  transition: border-color 0.15s;
  resize: vertical;
}

.form-input:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.1);
}

.form-help {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.primary-button {
  padding: 10px 16px;
  background-color: #4361ee;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
}

.primary-button:hover:not(:disabled) {
  background-color: #3651d4;
}

.primary-button:disabled {
  background-color: #c7d2fe;
  cursor: not-allowed;
}

.secondary-button {
  padding: 10px 16px;
  background-color: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
}

.secondary-button:hover {
  background-color: #f9fafb;
}

@media (max-width: 640px) {
  .modal-container {
    width: 92%;
    max-height: 85vh;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 12px;
  }
  
  .primary-button, .secondary-button {
    width: 100%;
  }
}
</style>