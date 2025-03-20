<template>
  <div class="image-uploader">
    <!-- File Input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileSelect"
    />

    <div class="flex flex-col gap-4">
      <!-- Upload Button -->
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        @click="triggerFileInput"
        :disabled="uploading"
      >
        {{ uploading ? "Uploading..." : "Choose Image" }}
      </button>

      <!-- Preview -->
      <div v-if="preview" class="mt-4">
        <img :src="preview" alt="Preview" class="max-w-xs rounded-lg shadow-md" />

        <!-- Image Details Form -->
        <div class="mt-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Alt Text</label>
            <input
              v-model="altText"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Describe the image"
            />
          </div>

          <button
            @click="confirmUpload"
            class="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            :disabled="uploading"
          >
            {{ uploading ? "Uploading..." : "Upload Image" }}
          </button>
        </div>
      </div>

      <!-- Previously Uploaded Images -->
      <div v-if="storedImages.length > 0" class="mt-8">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Previously Uploaded Images</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div 
            v-for="image in storedImages" 
            :key="image.url" 
            class="relative group cursor-pointer"
            @click="selectStoredImage(image)"
          >
            <img 
              :src="image.url" 
              :alt="image.name"
              class="w-full h-32 object-cover rounded-lg shadow-sm transition-transform hover:scale-105"
            />
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
              <span class="text-white opacity-0 group-hover:opacity-100">Select</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="p-4 text-sm text-red-700 bg-red-100 rounded-md"
        role="alert"
      >
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useMinIO } from "~/composables/useMinIO";

interface ImageDetails {
  url: string;
  alt: string;
}

const emit = defineEmits<{
  (e: "uploaded", details: ImageDetails): void;
  (e: "error", message: string): void;
}>();

// State
const { uploadImage, storedImages, isLoading, listStoredImages } = useMinIO();
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const error = ref("");
const preview = ref("");
const altText = ref("");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Methods
const resetState = () => {
  error.value = "";
  preview.value = "";
  altText.value = "";
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

const confirmUpload = async () => {
  if (!fileInput.value?.files?.length) return;

  const file = fileInput.value.files[0];
  uploading.value = true;
  error.value = "";

  try {
    const imageUrl = await uploadImage(file);
    console.log('MinIO upload successful:', imageUrl);

    emit("uploaded", {
      url: imageUrl,
      alt: altText.value || file.name,
    });

    // Reset the component
    resetState();
    if (fileInput.value) {
      fileInput.value.value = "";
    }

    // Refresh the list of stored images
    await listStoredImages();
  } catch (e) {
    console.error('MinIO upload error:', e);
    error.value = e instanceof Error ? e.message : "Failed to upload image to MinIO";
    emit("error", error.value);
  } finally {
    uploading.value = false;
  }
};

const selectStoredImage = (image: any) => {
  emit("uploaded", {
    url: image.url,
    alt: image.name,
  });
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
