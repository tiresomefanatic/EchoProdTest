<!-- components/ImageUploader.vue -->
<template>
  <div class="image-uploader">
    <!-- File Input -->
    <input
      type="file"
      ref="fileInput"
      accept="image/*"
      @change="handleFileSelect"
      style="display: none"
      multiple
    />

    <!-- Drop Zone -->
    <div
      class="drop-zone"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      :class="{ 'is-dragging': isDragging }"
    >
      <!-- Upload Button -->
      <button
        @click="triggerFileInput"
        class="upload-button"
        :disabled="uploading"
        :class="{ 'opacity-50 cursor-not-allowed': uploading }"
      >
        <span v-if="!uploading" class="flex items-center">
          <span class="text-xl mr-2">📁</span>
          Choose Image
        </span>
        <span v-else class="flex items-center">
          <span class="loading-spinner mr-2"></span>
          Uploading...
        </span>
      </button>

      <p class="text-sm text-gray-500 mt-2">or drag and drop image here</p>

      <!-- File Requirements -->
      <div class="text-xs text-gray-400 mt-2">
        Supported formats: JPG, PNG, GIF, WebP (max 5MB)
      </div>
    </div>

    <!-- Preview Section -->
    <div v-if="preview" class="preview-section">
      <img :src="preview" alt="Upload preview" class="preview-image" />
      <div class="preview-options">
        <input
          v-model="altText"
          placeholder="Add alt text"
          class="alt-text-input"
        />
        <div class="image-options">
          <button
            v-for="align in ['left', 'center', 'right']"
            :key="align"
            @click="alignment = align"
            :class="['align-button', { active: alignment === align }]"
            :title="'Align ' + align"
          >
            {{ alignmentIcons[align] }}
          </button>
        </div>
        <button
          @click="confirmUpload"
          class="confirm-button"
          :disabled="uploading"
        >
          Insert Image
        </button>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useGithub } from "~/composables/useGithub";

interface ImageDetails {
  url: string;
  alt: string;
  alignment: "left" | "center" | "right";
}

const emit = defineEmits<{
  (e: "uploaded", details: ImageDetails): void;
  (e: "error", message: string): void;
}>();

// State
const { uploadImage } = useGithub();
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const error = ref("");
const preview = ref("");
const isDragging = ref(false);
const altText = ref("");
const alignment = ref<"left" | "center" | "right">("center");

// Constants
const alignmentIcons = {
  left: "⟵",
  center: "↔",
  right: "⟶",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Methods
const resetState = () => {
  error.value = "";
  preview.value = "";
  altText.value = "";
  alignment.value = "center";
};

const validateFile = (file: File): boolean => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Please select a valid image file (JPG, PNG, GIF, WebP)");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image size should be less than 5MB");
  }

  return true;
};

const createPreview = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  try {
    resetState();
    validateFile(file);
    createPreview(file);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to process image";
    emit("error", error.value);
  }
};

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];

  if (!file) return;

  try {
    resetState();
    validateFile(file);
    createPreview(file);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to process image";
    emit("error", error.value);
  }
};

const confirmUpload = async () => {
  if (!fileInput.value?.files?.length) return;

  const file = fileInput.value.files[0];
  uploading.value = true;
  error.value = "";

  try {
    const imageUrl = await uploadImage(file);
    emit("uploaded", {
      url: imageUrl,
      alt: altText.value,
      alignment: alignment.value,
    });

    // Reset the component
    resetState();
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to upload image";
    emit("error", error.value);
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
.image-uploader {
  width: 100%;
  max-width: 36rem;
  margin: 0 auto;
}

.drop-zone {
  border: 2px dashed #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s;
}

.drop-zone.is-dragging {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.upload-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.preview-section {
  margin-top: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.preview-image {
  max-width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: contain;
  margin: 0 auto;
  display: block;
  border-radius: 0.375rem;
}

.preview-options {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alt-text-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.alt-text-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.image-options {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.align-button {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: white;
  transition: all 0.2s;
}

.align-button:hover {
  background-color: #f9fafb;
}

.align-button.active {
  background-color: #eff6ff;
  border-color: #3b82f6;
}

.confirm-button {
  width: 100%;
  padding: 0.5rem 1rem;
  background-color: #10b981;
  color: white;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
  margin-top: 0.75rem;
}

.confirm-button:hover:not(:disabled) {
  background-color: #059669;
}

.confirm-button:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

.error-message {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background-color: #fef2f2;
  color: #dc2626;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}
</style>
