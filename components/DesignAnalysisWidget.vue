<script setup lang="ts">
import { ref, onMounted, defineProps } from 'vue';

const props = defineProps({
  onClose: Function,
  initialContent: {
    type: String,
    default: ''
  }
})

const feedback = ref([]);
const isLoading = ref(false);
const scanProgress = ref(0);
const content = ref(props.initialContent || '');
const uploadedFiles = ref([]);

const mockTypographyFeedback = [
  {
    category: "Font Usage",
    icon: "type",
    items: [
      { type: "success", message: "Consistent use of PP Neue Montreal as the primary typeface" },
      { type: "warning", message: "Consider using a secondary typeface for better hierarchy" },
      { type: "error", message: "Inconsistent font weight usage in navigation items" },
    ],
  },
  {
    category: "Accessibility",
    icon: "eye",
    items: [
      { type: "success", message: "Good contrast ratio for main body text" },
      { type: "warning", message: "Increase contrast for muted text in the sidebar" },
      { type: "error", message: "Font size too small for mobile devices in some sections" },
    ],
  },
  {
    category: "Hierarchy",
    icon: "scale",
    items: [
      { type: "success", message: "Clear distinction between heading levels" },
      { type: "warning", message: "Consider increasing size difference between h1 and h2" },
      { type: "success", message: "Effective use of font weight for emphasis" },
    ],
  },
  {
    category: "Spacing",
    icon: "ruler",
    items: [
      { type: "success", message: "Consistent line height across body text" },
      { type: "warning", message: "Increase paragraph spacing for better readability" },
      { type: "error", message: "Inconsistent margin between headings and paragraphs" },
    ],
  },
];

onMounted(() => {
  if (props.initialContent) {
    analyzeDesign(props.initialContent);
  }
});

const analyzeDesign = (textToAnalyze = '') => {
  isLoading.value = true;
  scanProgress.value = 0;
  content.value = textToAnalyze;

  // Simulate scanning progress
  const interval = setInterval(() => {
    scanProgress.value += 10;
    if (scanProgress.value >= 100) {
      clearInterval(interval);
      isLoading.value = false;
      feedback.value = mockTypographyFeedback;
    }
  }, 200);
}

const handleFileUpload = (event) => {
  const files = event.target.files;
  if (files?.length) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        uploadedFiles.value.push({
          id: Date.now() + i,
          name: file.name,
          size: formatFileSize(file.size),
          preview: file.type.startsWith('image/') ? e.target?.result : null,
          type: file.type
        });
      };
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
    analyzeDesign();
  }
}

const removeFile = (fileId) => {
  uploadedFiles.value = uploadedFiles.value.filter(file => file.id !== fileId);
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

const getIconForCategory = (iconName) => {
  switch (iconName) {
    case 'type':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M4 7V4h16v3"></path><path d="M9 20h6"></path><path d="M12 4v16"></path></svg>`;
    case 'eye':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    case 'scale':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path></svg>`;
    case 'ruler':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z"></path><path d="m7.5 10.5 2-2"></path><path d="m10.5 7.5 2-2"></path><path d="m13.5 4.5 2-2"></path><path d="m4.5 13.5 2-2"></path></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;
  }
}
</script>

<template>
  <div class="design-analysis-widget">
    <div class="widget-header">
      <div class="header-title">
        <!-- Bot icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="icon-bot"
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </svg>
        <span class="title-text">Design Analysis</span>
      </div>
      <button 
        class="close-button" 
        @click="props.onClose"
        aria-label="Close design analysis"
        tabindex="0"
        @keydown.enter="props.onClose"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="icon-close"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
    <div class="widget-content">
      <!-- Analysis Options -->
      <div v-if="!feedback.length && !isLoading" class="analysis-options">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="logo-large"
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </svg>
        <div class="content-section">
          <h3 class="section-title">Design Analysis</h3>
          
          <!-- Content textarea -->
          <div class="form-group">
            <label for="content-textarea" class="input-label">Content to analyze</label>
            <textarea
              id="content-textarea"
              v-model="content"
              placeholder="Paste your content here for analysis..."
              class="content-textarea"
            ></textarea>
          </div>
          
          <!-- File upload area -->
          <div class="form-group">
            <label for="file-upload" class="input-label">Upload files for analysis</label>
            <div class="upload-area" :class="{ 'has-files': uploadedFiles.length > 0 }">
              <!-- Uploaded files list -->
              <div v-if="uploadedFiles.length > 0" class="uploaded-files">
                <div v-for="file in uploadedFiles" :key="file.id" class="file-item">
                  <div class="file-preview">
                    <img v-if="file.preview" :src="file.preview" alt="Preview" class="file-thumbnail" />
                    <div v-else class="file-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </div>
                  </div>
                  <div class="file-info">
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">{{ file.size }}</span>
                  </div>
                  <button 
                    class="file-remove" 
                    @click="removeFile(file.id)"
                    aria-label="Remove file"
                    tabindex="0"
                    @keydown.enter="removeFile(file.id)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Upload dropzone -->
              <label class="upload-dropzone" for="file-input">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <span>Drag & drop files or click to browse</span>
                <input 
                  id="file-input" 
                  type="file" 
                  class="hidden-input" 
                  accept="image/*,.html,.css" 
                  multiple
                  @change="handleFileUpload" 
                />
              </label>
            </div>
          </div>
          
          <button 
            class="analyze-button"
            @click="analyzeDesign(content)"
            aria-label="Analyze design"
            tabindex="0"
            @keydown.enter="analyzeDesign(content)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Analyze Design
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="loading-spinner"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <p class="loading-text">Analyzing design...</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${scanProgress}%` }"></div>
        </div>
      </div>

      <!-- Results -->
      <div v-if="feedback.length > 0 && !isLoading" class="feedback-results">
        <div v-for="category in feedback" :key="category.category" class="feedback-category">
          <h3 class="category-title" v-html="getIconForCategory(category.icon) + ' ' + category.category"></h3>
          <ul class="feedback-list">
            <li v-for="(item, index) in category.items" :key="index" 
                :class="`feedback-item ${
                  item.type === 'success' ? 'success' : 
                  item.type === 'warning' ? 'warning' : 'error'
                }`">
              <span class="feedback-icon">{{ item.type === 'success' ? '✓' : item.type === 'warning' ? '⚠' : '✗' }}</span>
              <span class="feedback-message">{{ item.message }}</span>
            </li>
          </ul>
        </div>
        <div class="action-buttons">
          <button
            class="new-analysis-button"
            @click="() => { feedback = []; uploadedFiles = []; }"
            aria-label="Start new analysis"
            tabindex="0"
            @keydown.enter="() => { feedback = []; uploadedFiles = []; }"
          >
            Start New Analysis
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.design-analysis-widget {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  width: 380px;
  height: 540px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  background-color: rgba(250, 250, 250, 0.99);
  backdrop-filter: blur(27px);
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-text {
  font-weight: 600;
  font-size: 1.125rem;
  color: #000;
}

.icon-bot {
  height: 1.25rem;
  width: 1.25rem;
  color: #FF5310;
}

.close-button {
  height: 2rem;
  width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #000;
}

.close-button:hover {
  background-color: #f3f4f6;
}

.icon-close {
  width: 1rem;
  height: 1rem;
}

.widget-content {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}

.analysis-options {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  text-align: center;
}

.logo-large {
  width: 3rem;
  height: 3rem;
  color: #FF5310;
  margin-bottom: 1rem;
}

.content-section {
  width: 100%;
}

.section-title {
  font-weight: 600;
  font-size: 1.125rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  text-align: left;
}

.content-textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.5rem;
  font-size: 0.875rem;
  resize: vertical;
}

.content-textarea:focus {
  outline: none;
  border-color: #FF5310;
  box-shadow: 0 0 0 1px #FF5310;
}

.upload-area {
  margin-top: 0.5rem;
}

.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  border: 2px dashed #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: border-color 0.2s ease;
  background: #f9fafb;
  gap: 0.75rem;
}

.upload-dropzone:hover {
  border-color: #FF5310;
}

.upload-dropzone svg {
  width: 2rem;
  height: 2rem;
  color: #9ca3af;
}

.upload-dropzone span {
  font-size: 0.875rem;
  color: #6b7280;
}

.hidden-input {
  display: none;
}

.uploaded-files {
  margin-bottom: 1rem;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  background: white;
}

.file-preview {
  width: 2.5rem;
  height: 2.5rem;
  margin-right: 0.75rem;
  overflow: hidden;
  border-radius: 0.25rem;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon svg {
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
}

.file-info {
  flex: 1;
  text-align: left;
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.file-size {
  color: #6b7280;
  font-size: 0.75rem;
}

.file-remove {
  color: #6b7280;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-remove:hover {
  background-color: #f3f4f6;
  color: #FF5310;
}

.analyze-button {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  background-color: #FF5310;
  color: white;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  width: 100%;
  transition: background-color 0.2s;
  margin-top: 1rem;
}

.analyze-button:hover {
  background-color: rgba(255, 83, 16, 0.9);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.loading-spinner {
  height: 2rem;
  width: 2rem;
  color: #FF5310;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #6b7280;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #FF5310;
  transition: width 0.2s ease;
}

.feedback-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-category {
  background-color: white;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  padding: 1rem;
  transition: box-shadow 0.2s;
}

.feedback-category:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.category-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #1f2937;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.feedback-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.feedback-item.success {
  color: #059669;
}

.feedback-item.warning {
  color: #d97706;
}

.feedback-item.error {
  color: #dc2626;
}

.feedback-icon {
  margin-top: 0.25rem;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.new-analysis-button {
  background-color: #FF5310;
  color: white;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.new-analysis-button:hover {
  background-color: rgba(255, 83, 16, 0.9);
}
</style>

