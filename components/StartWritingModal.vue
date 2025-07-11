<template>
  <div
    v-if="isOpen"
    class="modal-overlay"
    @click.self="$emit('cancel')"
  >
    <div class="modal-container">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <h2 class="modal-title">Start Writing</h2>
          <p class="modal-subtitle">Share your insights with the community</p>
        </div>
        <button
          @click="$emit('cancel')"
          class="close-button"
          aria-label="Close modal"
        >
          <svg class="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- Title -->
        <div class="form-group">
          <label class="form-label">Article Title</label>
          <input
            type="text"
            :value="formData.title"
            @input="handleTitleChange"
            class="form-input"
            placeholder="Enter the article title…"
          />
        </div>

        <!-- Category -->
        <div class="form-group">
          <label class="form-label">Categories</label>
          <div class="category-buttons">
            <button
              v-for="categoryOption in categoryOptions"
              :key="categoryOption"
              type="button"
              @click="handleCategoryToggle(categoryOption)"
              :class="[
                'category-option',
                { 'active': formData.category.includes(categoryOption) }
              ]"
            >
              {{ categoryOption }}
            </button>
          </div>
          <p class="form-help">Select a category that best describes your article</p>
        </div>

        <!-- Tags -->
        <div class="form-group">
          <label class="form-label">Tags</label>
          <input
            type="text"
            :value="formData.tags"
            @input="handleTagsChange"
            placeholder="design system, accessibility…"
            class="form-input"
          />
        </div>

        <!-- Collaborators -->
        <div class="form-group">
          <label class="form-label">Collaborators</label>
          <div class="collaborator-input">
            <input
              type="email"
              :value="newCollaborator"
              @input="handleCollaboratorInput"
              @keydown="handleCollaboratorKeydown"
              placeholder="email@example.com"
              class="form-input collaborator-email"
            />
            <button
              @click="handleAddCollaborator"
              class="add-button"
              title="Add collaborator"
            >
              +
            </button>
          </div>

          <div v-if="formData.collaborators.length > 0" class="collaborators-list">
            <div
              v-for="email in formData.collaborators"
              :key="email"
              class="collaborator-tag"
            >
              {{ email }}
              <button 
                @click="handleRemoveCollaborator(email)" 
                class="remove-collaborator"
                :aria-label="`Remove ${email}`"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button
          @click="$emit('cancel')"
          class="cancel-button"
        >
          Cancel
        </button>
        <button
          @click="handleSubmit"
          :disabled="!canSubmit"
          class="submit-button"
          :class="{ 'disabled': !canSubmit }"
        >
          Start Writing
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Interfaces
interface FormData {
  title: string;
  tags: string;
  category: string[];
  collaborators: string[];
}

interface Props {
  isOpen: boolean;
  formData: FormData;
  newCollaborator: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'cancel': [];
  'submit': [];
  'update:formData': [value: FormData];
  'update:newCollaborator': [value: string];
  'add-collaborator': [];
  'remove-collaborator': [email: string];
}>();

// Category options
const categoryOptions = ["Design System", "Design", "Product", "Engineering"];

// Computed
const canSubmit = computed(() => {
  return props.formData.title.trim() && props.formData.category.length > 0;
});

// Event handlers
const handleTitleChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:formData', {
    ...props.formData,
    title: target.value
  });
};

const handleTagsChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:formData', {
    ...props.formData,
    tags: target.value
  });
};

const handleCategoryToggle = (categoryName: string) => {
  const newCategories = props.formData.category.includes(categoryName) 
    ? [] 
    : [categoryName];
  
  emit('update:formData', {
    ...props.formData,
    category: newCategories
  });
};

const handleCollaboratorInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:newCollaborator', target.value);
};

const handleCollaboratorKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    emit('add-collaborator');
  }
};

const handleAddCollaborator = () => {
  emit('add-collaborator');
};

const handleRemoveCollaborator = (email: string) => {
  emit('remove-collaborator', email);
};

const handleSubmit = () => {
  if (canSubmit.value) {
    emit('submit');
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 16px;
  font-family: "PP Neue Montreal", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 768px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.header-content h2 {
  margin: 0;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.modal-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.close-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 200ms;
}

.close-button:hover {
  background: #f3f4f6;
}

.close-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

/* Body */
.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 16px;
  transition: all 200ms;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #FF5310;
  box-shadow: 0 0 0 3px rgba(255, 83, 16, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

/* Categories */
.category-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.category-option {
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
  transition: all 200ms;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #374151;
  cursor: pointer;
}

.category-option:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.category-option.active {
  background: #FF5310;
  color: white;
  border-color: #FF5310;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.form-help {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

/* Collaborators */
.collaborator-input {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.collaborator-email {
  flex: 1;
}

.add-button {
  padding: 12px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  cursor: pointer;
  transition: all 200ms;
  font-weight: 500;
}

.add-button:hover {
  background: #e5e7eb;
}

.collaborators-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.collaborator-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: rgba(255, 83, 16, 0.1);
  color: #FF5310;
  border-radius: 9999px;
  font-size: 14px;
}

.remove-collaborator {
  background: none;
  border: none;
  color: #FF5310;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  transition: color 200ms;
}

.remove-collaborator:hover {
  color: #dc2626;
}

/* Footer */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.cancel-button {
  padding: 10px 20px;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms;
}

.cancel-button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.submit-button {
  padding: 10px 20px;
  background: #FF5310;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms;
}

.submit-button:hover:not(.disabled) {
  background: #dc2626;
}

.submit-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 