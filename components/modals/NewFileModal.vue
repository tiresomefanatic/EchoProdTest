<template>
  <div v-if="isVisible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Create New File</h3>
        <button class="close-button" @click="handleClose" aria-label="Close modal">
          <span>×</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="file-name">File Name:</label>
          <input 
            id="file-name" 
            v-model="fileName" 
            type="text" 
            placeholder="Enter file name"
            @keydown.enter="handleCreate"
            ref="fileNameInput"
          />
          <div class="help-text">
            File will be created at:
            <span class="path">{{ displayPath }}</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-button" @click="handleClose">Cancel</button>
        <button 
          class="create-button" 
          :disabled="!fileName.trim()" 
          @click="handleCreate"
        >
          Create
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from 'vue';
import { useSidebarEditorStore } from '~/store/sidebarEditor';

const sidebarEditorStore = useSidebarEditorStore();

// Reactive properties
const fileName = ref('');
const fileNameInput = ref<HTMLInputElement | null>(null);

// Computed properties
const isVisible = computed(() => sidebarEditorStore.showNewFileModal);
const parentPath = computed(() => sidebarEditorStore.newItemParentPath);
const displayPath = computed(() => {
  const path = parentPath.value === '/' 
    ? '/' 
    : `${parentPath.value}/`;
  return `${path}${fileName.value.trim() || 'filename'}.md`;
});

// Methods
const handleClose = () => {
  sidebarEditorStore.closeModals();
};

const handleCreate = async () => {
  if (!fileName.value.trim()) return;
  
  sidebarEditorStore.newItemName = fileName.value;
  await sidebarEditorStore.createNewFile();
};

const handleOverlayClick = (event: MouseEvent) => {
  if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
    handleClose();
  }
};

// Focus input field when modal opens
watch(isVisible, async (newValue) => {
  if (newValue) {
    fileName.value = '';
    await nextTick();
    fileNameInput.value?.focus();
  }
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
  z-index: 100;
}

.modal-content {
  background-color: white;
  border-radius: 4px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  padding: 4px 8px;
  cursor: pointer;
  color: #666;
  line-height: 1;
}

.modal-body {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.help-text {
  font-size: 0.75rem;
  color: #6b7280;
}

.path {
  font-family: monospace;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}

.cancel-button {
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.create-button {
  padding: 8px 16px;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.create-button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}
</style> 