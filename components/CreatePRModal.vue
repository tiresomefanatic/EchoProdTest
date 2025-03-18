<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <h3 class="modal-title">Create Pull Request</h3>
      <p class="modal-description">Merge changes from one branch to another</p>

      <div class="form-group">
        <label for="base">Target Branch (merge into)</label>
        <select
          id="base"
          v-model="baseBranch"
          class="form-select"
          :disabled="loading"
        >
          <option value="">Select target branch</option>
          <option v-for="branch in branches" :key="branch" :value="branch">
            {{ branch }}
          </option>
        </select>
        <span class="helper-text" v-if="!baseBranch"
          >This is the branch where changes will be merged into</span
        >
      </div>

      <div class="form-group">
        <label for="head">Source Branch (merge from)</label>
        <select
          id="head"
          v-model="headBranch"
          class="form-select"
          :disabled="loading"
        >
          <option value="">Select source branch</option>
          <option v-for="branch in branches" :key="branch" :value="branch">
            {{ branch }}
          </option>
        </select>
        <span class="helper-text" v-if="!headBranch"
          >This is the branch containing your changes</span
        >
      </div>

      <div class="form-group">
        <label for="title">Title</label>
        <input
          id="title"
          v-model="title"
          type="text"
          class="form-input"
          :placeholder="titlePlaceholder"
          :disabled="loading"
        />
        <span class="validation-error" v-if="showValidation && !title.trim()">
          Title is required
        </span>
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          v-model="description"
          class="form-textarea"
          placeholder="Enter PR description"
          rows="4"
          :disabled="loading"
        ></textarea>
      </div>

      <div class="validation-summary" v-if="showValidation && !isValid">
        <p>Please fix the following issues:</p>
        <ul>
          <li v-if="!baseBranch">Select a target branch</li>
          <li v-if="!headBranch">Select a source branch</li>
          <li v-if="baseBranch === headBranch && baseBranch">
            Target and source branches must be different
          </li>
          <li v-if="!title.trim()">Enter a title for the pull request</li>
        </ul>
      </div>

      <div class="modal-actions">
        <button
          class="cancel-button"
          @click="handleClose"
          :disabled="loading"
        >
          Cancel
        </button>
        <button
          class="create-button"
          @click="handleSubmit"
          :disabled="!isValid || loading"
        >
          {{ loading ? "Creating..." : "Create Pull Request" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useGithub } from "~/composables/useGithub";
import { useToast } from "~/composables/useToast";
import { useEditorStore } from "~/store/editor";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created", pr: any): void;
}>();

const { createNewPullRequest, user, currentBranch, branches } = useGithub();
const { showToast } = useToast();
const editorStore = useEditorStore();

// Form state
const loading = ref(false);
const baseBranch = ref("main");
const headBranch = ref("");
const title = ref("");
const description = ref("");
const showValidation = ref(false);

// Initialize with current branch when the modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    headBranch.value = currentBranch.value;
  }
});

// Computed properties
const titlePlaceholder = computed(() => {
  if (headBranch.value && baseBranch.value) {
    return `${user.value?.login || 'user'} wants to merge from ${headBranch.value} into ${baseBranch.value}`;
  }
  return 'Enter PR title';
});

const isValid = computed(() => {
  return (
    baseBranch.value &&
    headBranch.value &&
    title.value.trim() &&
    baseBranch.value !== headBranch.value
  );
});

// Methods
const handleClose = () => {
  emit("close");
};

const handleSubmit = async () => {
  showValidation.value = true;

  if (!isValid.value || loading.value) return;

  loading.value = true;
  try {
    const result = await createNewPullRequest(
      baseBranch.value,
      headBranch.value,
      title.value,
      description.value
    );

    if (result) {
      showToast({
        title: "Success",
        message: "Pull request created successfully",
        type: "success",
      });
      
      // Optimistically add the new PR to the store
      editorStore.addPullRequest(result);
      
      // Reset form
      title.value = "";
      description.value = "";
      
      // Emit created event with the new PR
      emit("created", result);
    }
  } catch (error) {
    console.error("Error creating pull request:", error);
    showToast({
      title: "Error",
      message: error instanceof Error ? error.message : "Failed to create pull request",
      type: "error",
    });
  } finally {
    loading.value = false;
  }
};
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
  z-index: 1000;
}

.modal-content {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
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

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-family: "PP Neue Montreal", sans-serif;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.form-select,
.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  font-family: "PP Neue Montreal", sans-serif;
  font-size: 14px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background-color: #F9FAFB;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #4361EE;
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.1);
}

.helper-text {
  display: block;
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
}

.validation-error {
  color: #EF4444;
  font-size: 12px;
  margin-top: 4px;
}

.validation-summary {
  margin-bottom: 24px;
  padding: 12px;
  background-color: #FEF2F2;
  border-radius: 6px;
  border-left: 4px solid #EF4444;
}

.validation-summary p {
  color: #B91C1C;
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 8px;
}

.validation-summary ul {
  margin: 0;
  padding-left: 20px;
  color: #B91C1C;
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