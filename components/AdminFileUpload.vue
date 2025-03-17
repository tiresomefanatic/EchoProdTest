<!-- components/AdminFileUpload.vue -->
<template>
  <div class="file-upload-container">
    <div class="header-container">
      <div class="header-text">
        <h2 class="header-title">Context Files</h2>
        <p class="header-description">Manage files that provide context to the AI assistant</p>
      </div>
      <button class="upload-button" @click="handleOpenUploadDialog">
        <span class="plus-icon">+</span>
        Upload New File
      </button>
    </div>

    <div class="file-list-header">
      <div class="file-count">{{ files.length }} files available for the AI assistant</div>
      <div class="search-container">
        <SearchIcon class="search-icon" />
        <input 
          type="text" 
          placeholder="Search files..." 
          class="search-input"
          v-model="searchQuery"
        />
      </div>
    </div>

    <div class="table-container">
      <table class="files-table">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Type</th>
            <th>Size</th>
            <th>Upload Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="loading-cell">
              <Loader2Icon class="loading-icon" />
            </td>
          </tr>
          <template v-else-if="filteredFiles.length > 0">
            <tr
              v-for="file in filteredFiles"
              :key="file.id"
              class="file-row"
            >
              <td class="file-name-cell">
                <div class="file-icon-name">
                  <FileIcon :type="file.type" />
                  <span>{{ file.name }}</span>
                </div>
              </td>
              <td>{{ file.type }}</td>
              <td>{{ file.size }}</td>
              <td>{{ file.uploadDate }}</td>
              <td>
                <div class="status-badge">
                  Active
                </div>
              </td>
              <td>
                <div class="actions-container">
                  <button 
                    class="action-button" 
                    @click.stop="handlePreviewFile(file)"
                    aria-label="View file"
                    tabindex="0"
                  >
                    <EyeIcon />
                  </button>
                  <button 
                    class="action-button" 
                    @click.stop="handleEditFile(file)"
                    aria-label="Edit file"
                    tabindex="0"
                  >
                    <EditIcon />
                  </button>
                  <button 
                    class="action-button" 
                    @click.stop="handleDeleteFile(file.id)"
                    aria-label="Delete file"
                    tabindex="0"
                  >
                    <Trash2Icon />
                  </button>
                  <button 
                    class="action-button" 
                    @click.stop="handleDownloadFile(file)"
                    aria-label="Download file"
                    tabindex="0"
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="6" class="empty-message">
              No files found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- File Preview Dialog -->
    <div v-if="isPreviewOpen" class="dialog-overlay" @click="isPreviewOpen = false">
      <div class="dialog-content preview-dialog" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">File Preview: {{ selectedFile?.name }}</h3>
          <p class="dialog-description">
            Type: {{ selectedFile?.type }} | Size: {{ selectedFile?.size }} | Uploaded: {{ selectedFile?.uploadDate }}
          </p>
          <button class="close-button" @click="isPreviewOpen = false" aria-label="Close">×</button>
        </div>
        <div class="dialog-body">
          <div v-if="selectedFile?.type === 'Image' || selectedFile?.type === 'PNG'" class="image-preview">
            <img
              :src="selectedFile.thumbnail || '/placeholder.svg?height=400&width=600'"
              :alt="selectedFile.name"
              class="preview-image"
            />
          </div>
          <div v-else class="text-preview">
            {{ selectedFile?.content || "No preview available" }}
          </div>
        </div>
      </div>
    </div>

    <!-- Edit File Dialog -->
    <div v-if="isEditOpen" class="dialog-overlay" @click="isEditOpen = false">
      <div class="dialog-content edit-dialog" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">Edit File: {{ selectedFile?.name }}</h3>
          <p class="dialog-description">
            Update the content of this file to improve the AI assistant's knowledge
          </p>
          <button class="close-button" @click="isEditOpen = false" aria-label="Close">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label for="file-title" class="form-label">File Name</label>
            <input 
              id="file-title" 
              type="text" 
              class="form-input" 
              v-model="editTitle" 
            />
          </div>
          <div class="form-group">
            <label for="file-content" class="form-label">Content</label>
            <textarea
              id="file-content"
              class="form-textarea"
              v-model="editContent"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="cancel-button" @click="isEditOpen = false">
            Cancel
          </button>
          <button class="save-button" @click="handleSaveEdit">
            Save Changes
          </button>
        </div>
      </div>
    </div>

    <!-- Upload File Dialog -->
    <div v-if="isUploadOpen" class="dialog-overlay" @click="isUploadOpen = false">
      <div class="dialog-content upload-dialog" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">Upload New File</h3>
          <p class="dialog-description">
            Add files to provide additional context for the AI assistant
          </p>
          <button class="close-button" @click="isUploadOpen = false" aria-label="Close">×</button>
        </div>
        <div class="dialog-body">
          <form @submit.prevent="handleFileUpload" class="upload-form">
            <div class="form-group">
              <label for="file" class="form-label">File</label>
              <input id="file" type="file" class="form-file-input" />
            </div>
            
            <div class="form-group">
              <label for="description" class="form-label">Description</label>
              <textarea
                id="description"
                class="form-textarea"
                placeholder="Provide a description of the file's content and purpose"
                v-model="description"
              ></textarea>
            </div>
            
            <div v-if="isUploading" class="upload-progress">
              <div class="progress-info">
                <span>Uploading...</span>
                <span>{{ uploadProgress }}%</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar" :style="{ width: `${uploadProgress}%` }"></div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-button" @click="isUploadOpen = false">
                Cancel
              </button>
              <button type="submit" class="upload-submit-button" :disabled="isUploading">
                <Loader2Icon v-if="isUploading" class="button-icon spinning" />
                <FileUpIcon v-else class="button-icon" />
                {{ isUploading ? 'Uploading...' : 'Upload File' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Important Alert -->
    <div class="alert">
      <AlertCircleIcon class="alert-icon" />
      <div class="alert-content">
        <h4 class="alert-title">Important</h4>
        <p class="alert-description">
          Files uploaded here will be used to provide context to the AI assistant. Make sure they contain accurate and
          relevant information.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue';
import { 
  Loader2 as Loader2Icon, 
  FileText as FileTextIcon, 
  FileCode as FileCodeIcon, 
  Trash2 as Trash2Icon, 
  Eye as EyeIcon, 
  FileUp as FileUpIcon, 
  AlertCircle as AlertCircleIcon, 
  Edit as EditIcon, 
  Check as CheckIcon, 
  X as XIcon, 
  PlusCircle as PlusCircleIcon, 
  Download as DownloadIcon, 
  Search as SearchIcon 
} from 'lucide-vue-next';

// File Icon component
const FileIcon = defineComponent({
  props: {
    type: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const getIcon = () => {
      switch(props.type.toLowerCase()) {
        case 'pdf':
          return h('div', { class: 'file-type-icon pdf-icon' });
        case 'markdown':
        case 'md':
          return h('div', { class: 'file-type-icon md-icon' });
        case 'docx':
          return h('div', { class: 'file-type-icon docx-icon' });
        case 'json':
          return h('div', { class: 'file-type-icon json-icon' });
        case 'image':
        case 'png':
          return h('div', { class: 'file-type-icon image-icon' });
        default:
          return h('div', { class: 'file-type-icon default-icon' });
      }
    };

    return () => getIcon();
  }
});

// Mock data
const mockFiles = [
  {
    id: "file-001",
    name: "echo-design-guidelines.pdf",
    type: "PDF",
    size: "2.4 MB",
    uploadDate: "2023-12-22",
    status: "active",
    content: "This document contains the comprehensive design guidelines for the Echo design system.",
  },
  {
    id: "file-002",
    name: "component-library-documentation.md",
    type: "Markdown",
    size: "1.1 MB",
    uploadDate: "2023-12-20",
    status: "active",
    content: "Documentation for all available components in the Echo design system.",
  },
  {
    id: "file-003",
    name: "accessibility-standards.docx",
    type: "DOCX",
    size: "3.2 MB",
    uploadDate: "2023-12-18",
    status: "active",
    content: "Detailed accessibility requirements and implementation guidelines.",
  },
  {
    id: "file-004",
    name: "color-palette-reference.json",
    type: "JSON",
    size: "0.5 MB",
    uploadDate: "2023-12-15",
    status: "active",
    content: "{ \"colors\": { \"primary\": \"#FF5310\", \"secondary\": \"#1D1B1B\" } }",
  },
  {
    id: "file-005",
    name: "button-examples.png",
    type: "Image",
    size: "0.8 MB",
    uploadDate: "2023-12-14",
    status: "active",
    thumbnail: "/placeholder.svg?height=400&width=600",
  },
  {
    id: "file-006",
    name: "form-layout-examples.png",
    type: "Image",
    size: "0.7 MB",
    uploadDate: "2023-12-13",
    status: "active",
    thumbnail: "/placeholder.svg?height=400&width=600",
  },
  {
    id: "file-007",
    name: "typography-guide.md",
    type: "Markdown",
    size: "0.9 MB",
    uploadDate: "2023-12-10",
    status: "active",
    content: "# Typography Guidelines\n\nThis document outlines the typography system used in Echo.",
  },
  {
    id: "file-008",
    name: "responsive-design-principles.pdf",
    type: "PDF",
    size: "4.2 MB",
    uploadDate: "2023-12-05",
    status: "active",
    content: "Principles and best practices for responsive design implementation.",
  },
];

// State
const files = ref([]);
const isLoading = ref(true);
const uploadProgress = ref(0);
const isUploading = ref(false);
const selectedFile = ref(null);
const isPreviewOpen = ref(false);
const isEditOpen = ref(false);
const isUploadOpen = ref(false);
const description = ref("");
const searchQuery = ref("");
const editContent = ref("");
const editTitle = ref("");

// Computed
const filteredFiles = computed(() => {
  if (!searchQuery.value) return files.value;
  
  return files.value.filter((file) => {
    return (
      file.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (file.content && file.content.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
  });
});

// Methods
const handleOpenUploadDialog = () => {
  isUploadOpen.value = true;
};

const handleFileUpload = () => {
  // Simulate file upload
  isUploading.value = true;
  uploadProgress.value = 0;

  const interval = setInterval(() => {
    uploadProgress.value += 10;
    if (uploadProgress.value >= 100) {
      clearInterval(interval);
      isUploading.value = false;

      // Add a mock file to the list
      const newFile = {
        id: `file-00${files.value.length + 1}`,
        name: "new-uploaded-file.pdf",
        type: "PDF",
        size: "1.8 MB",
        uploadDate: new Date().toISOString().split('T')[0],
        status: "active",
        content: description.value,
      };

      files.value = [...files.value, newFile];
      description.value = "";
      isUploadOpen.value = false;
    }
  }, 300);
};

const handleDeleteFile = (id) => {
  files.value = files.value.filter((file) => file.id !== id);
};

const handlePreviewFile = (file) => {
  selectedFile.value = file;
  isPreviewOpen.value = true;
};

const handleEditFile = (file) => {
  selectedFile.value = file;
  editTitle.value = file.name;
  editContent.value = file.content || "";
  isEditOpen.value = true;
};

const handleSaveEdit = () => {
  if (selectedFile.value && editTitle.value) {
    files.value = files.value.map((file) => {
      if (file.id === selectedFile.value.id) {
        return {
          ...file,
          name: editTitle.value,
          content: editContent.value,
        };
      }
      return file;
    });

    isEditOpen.value = false;
  }
};

const handleDownloadFile = (file) => {
  // Implement download functionality
  console.log(`Downloading file: ${file.name}`);
};

// Lifecycle
onMounted(() => {
  // Simulate API call
  setTimeout(() => {
    files.value = mockFiles;
    isLoading.value = false;
  }, 1000);
});
</script>

<style scoped>
.file-upload-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #111827;
}

.header-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 4px;
  margin-bottom: 0;
}

.upload-button {
  background-color: #FF5310;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.upload-button:hover {
  background-color: rgba(255, 83, 16, 0.9);
}

.plus-icon {
  margin-right: 0.5rem;
  font-size: 1.25rem;
  line-height: 1;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.file-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.search-container {
  position: relative;
  width: 300px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
}

.search-input:focus {
  outline: none;
  border-color: #FF5310;
  box-shadow: 0 0 0 1px rgba(255, 83, 16, 0.2);
}

.table-container {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.files-table {
  width: 100%;
  border-collapse: collapse;
}

.files-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.files-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #111827;
}

.files-table tr:last-child td {
  border-bottom: none;
}

.file-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.file-name-cell {
  font-weight: 500;
}

.file-icon-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-type-icon {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.pdf-icon {
  background-color: #FF5310;
}

.md-icon {
  background-color: #3b82f6;
}

.docx-icon {
  background-color: #2563eb;
}

.json-icon {
  background-color: #10b981;
}

.image-icon {
  background-color: #8b5cf6;
}

.default-icon {
  background-color: #6b7280;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  background-color: #10b981;
}

.actions-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.action-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
}

.action-button:hover {
  color: #111827;
}

.action-button svg {
  width: 18px;
  height: 18px;
}

.loading-cell {
  text-align: center;
  padding: 24px;
}

.loading-icon {
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
  color: #FF5310;
  margin: 0 auto;
}

.empty-message {
  text-align: center;
  padding: 24px;
  color: #6b7280;
}

/* Dialog styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.dialog-content {
  background-color: white;
  border-radius: 0.5rem;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.preview-dialog {
  max-width: 48rem;
  height: 80vh;
}

.edit-dialog {
  max-width: 48rem;
  height: 80vh;
}

.upload-dialog {
  max-width: 36rem;
}

.dialog-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #111827;
}

.dialog-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  width: 2rem;
  height: 2rem;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  border-radius: 9999px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f3f4f6;
}

.dialog-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.dialog-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.image-preview {
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 60vh;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.text-preview {
  font-family: monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  color: #111827;
  overflow-x: auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input, .form-textarea, .form-file-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
}

.form-textarea {
  min-height: 8rem;
  resize: vertical;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #FF5310;
  box-shadow: 0 0 0 1px rgba(255, 83, 16, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.cancel-button {
  background-color: white;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background-color: #f9fafb;
}

.save-button, .upload-submit-button {
  background-color: #FF5310;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
}

.save-button:hover, .upload-submit-button:hover {
  background-color: rgba(255, 83, 16, 0.9);
}

.button-icon {
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

.upload-progress {
  margin-top: 1rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.progress-bar-container {
  width: 100%;
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #FF5310;
  transition: width 0.3s ease;
}

/* Alert styles */
.alert {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
  background-color: #f9fafb;
}

.alert-icon {
  width: 20px;
  height: 20px;
  color: #4b5563;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-top: 0;
  margin-bottom: 0.25rem;
}

.alert-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>