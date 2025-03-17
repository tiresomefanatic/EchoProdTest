<script setup lang="ts">
import { ref, onMounted, defineProps, computed } from 'vue';
import { marked } from 'marked';

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
const error = ref('');
const conversation = ref([]);
const userInput = ref('');
const isExpanded = ref(false);

const renderMarkdown = (text) => {
  if (!text) return '';
  try {
    return marked(text);
  } catch (err) {
    console.error('Error rendering markdown:', err);
    return text;
  }
};

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const widgetStyle = computed(() => {
  return isExpanded.value 
    ? { width: '620px', height: '680px' } 
    : { width: '380px', height: '540px' };
});

onMounted(() => {
  if (props.initialContent) {
    analyzeDesign();
  }
});

const analyzeDesign = async () => {
  if (!uploadedFiles.value.length && !content.value.trim()) {
    error.value = 'Please upload at least one image or provide some content to analyze';
    return;
  }
  
  error.value = '';
  isLoading.value = true;
  scanProgress.value = 0;
  
  // Start conversation with user message
  conversation.value = [{
    role: 'user',
    content: content.value || 'Please analyze this design',
    files: [...uploadedFiles.value]
  }];
  
  // Simulate scanning progress
  const interval = setInterval(() => {
    scanProgress.value += 5;
    if (scanProgress.value >= 95) {
      clearInterval(interval);
    }
  }, 200);
  
  try {
    // Prepare form data with files and content
    const formData = new FormData();
    
    // Add text content if available
    if (content.value.trim()) {
      formData.append('content', content.value);
    }
    
    // Add all uploaded files
    uploadedFiles.value.forEach(file => {
      if (file.fileObj) {
        formData.append('files', file.fileObj);
      }
    });
    
    // Add conversation history
    formData.append('conversation', JSON.stringify(
      conversation.value.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ));
    
    // Send to backend
    const response = await fetch('/api/design-analysis', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze design');
    }
    
    const result = await response.json();
    scanProgress.value = 100;
    
    // Process the feedback from LLM
    feedback.value = processLLMFeedback(result.feedback);
    
    // Extract text content from feedback for conversation history
    const feedbackText = extractFeedbackAsText(feedback.value);
    
    // Add bot response to conversation
    conversation.value.push({
      role: 'assistant',
      content: feedbackText, // Store the text content for history
      feedback: feedback.value
    });
    
    setTimeout(() => {
      isLoading.value = false;
    }, 500);
    
  } catch (err) {
    console.error('Error analyzing design:', err);
    error.value = err.message || 'Failed to analyze design';
    isLoading.value = false;
    clearInterval(interval);
  }
}

const extractFeedbackAsText = (feedbackCategories) => {
  if (feedbackCategories.length === 1 && feedbackCategories[0].category === "Response") {
    return feedbackCategories[0].items[0].message;
  }
  
  let textContent = '';
  
  feedbackCategories.forEach(category => {
    textContent += `## ${category.category}\n\n`;
    
    if (category.items && category.items.length) {
      category.items.forEach(item => {
        textContent += `${item.message}\n\n`;
      });
    }
    
    textContent += '\n';
  });
  
  return textContent.trim();
}

const processLLMFeedback = (llmFeedback) => {
  if (!llmFeedback || typeof llmFeedback === 'string') {
    return [{
      category: "Response",
      icon: "message-circle",
      items: [{ type: "text", message: llmFeedback || '' }]
    }];
  }
  
  return llmFeedback;
}

const handleFileUpload = (event) => {
  const files = event.target.files;
  if (files?.length) {
    processFiles(files);
  }
}

const handleDrop = (event) => {
  event.preventDefault();
  const files = event.dataTransfer.files;
  if (files?.length) {
    processFiles(files);
  }
}

const processFiles = (files) => {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Check if file is an image or SVG
    if (!file.type.startsWith('image/')) {
      error.value = 'Only image files are allowed';
      continue;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      uploadedFiles.value.push({
        id: Date.now() + i,
        name: file.name,
        size: formatFileSize(file.size),
        preview: e.target?.result,
        type: file.type,
        fileObj: file // Store the actual file object for uploading
      });
    };
    
    reader.readAsDataURL(file);
  }
  error.value = '';
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

const sendMessage = async () => {
  if (!userInput.value.trim() && uploadedFiles.value.length === 0) return;
  
  // Add user message to conversation
  conversation.value.push({
    role: 'user',
    content: userInput.value,
    files: [...uploadedFiles.value] // Store the current files with the message
  });
  
  const currentMessage = userInput.value;
  userInput.value = '';
  
  // Use a simple loading indicator for follow-up messages
  const messageIndex = conversation.value.length - 1;
  
  // Add temporary loading message that will be replaced
  conversation.value.push({
    role: 'assistant',
    content: '',
    isLoading: true
  });
  
  try {
    // Prepare form data
    const formData = new FormData();
    formData.append('content', currentMessage);
    
    // Add conversation history (without files, just context)
    formData.append('conversation', JSON.stringify(
      conversation.value.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ));
    
    // Add only the latest uploaded files
    uploadedFiles.value.forEach(file => {
      if (file.fileObj) {
        formData.append('files', file.fileObj);
      }
    });
    
    // Send to backend
    const response = await fetch('/api/design-analysis', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    const result = await response.json();
    
    // Process the feedback from LLM
    feedback.value = processLLMFeedback(result.feedback);
    
    // Extract text content from feedback for conversation history
    const feedbackText = extractFeedbackAsText(feedback.value);
    
    // Replace loading message with actual response
    conversation.value.pop(); // Remove the loading message
    conversation.value.push({
      role: 'assistant',
      content: feedbackText, // Store the text content for history
      feedback: feedback.value
    });
    
    // Clear uploaded files after they've been sent
    uploadedFiles.value = [];
    
  } catch (err) {
    console.error('Error sending message:', err);
    error.value = err.message || 'Failed to send message';
    
    // Replace loading message with error
    conversation.value.pop(); // Remove the loading message
    conversation.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error: ' + error.value,
      isError: true
    });
  }
}

const handleAdditionalFileUpload = (event) => {
  const files = event.target.files;
  if (files?.length) {
    processFiles(files);
  }
}
</script>

<template>
  <div class="design-analysis-widget" :style="widgetStyle">
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
      <div class="header-actions">
        <button 
          class="expand-button" 
          @click="toggleExpand"
          aria-label="Expand or collapse widget"
          tabindex="0"
          @keydown.enter="toggleExpand"
        >
          <svg
            v-if="isExpanded"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="4 14 10 14 10 20"></polyline>
            <polyline points="20 10 14 10 14 4"></polyline>
            <line x1="14" y1="10" x2="21" y2="3"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
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
    </div>
    <div class="widget-content">
      <!-- Analysis Options (Initial State) -->
      <div v-if="!conversation.length && !isLoading" class="analysis-options">
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
            <label for="content-textarea" class="input-label">Content to analyze (optional)</label>
            <textarea
              id="content-textarea"
              v-model="content"
              placeholder="Add any context about the design you're uploading..."
              class="content-textarea"
            ></textarea>
          </div>
          
          <!-- File upload area -->
          <div class="form-group">
            <label for="file-upload" class="input-label">Upload images for analysis</label>
            <div 
              class="upload-area" 
              :class="{ 'has-files': uploadedFiles.length > 0 }"
              @dragover.prevent
              @dragenter.prevent
              @drop="handleDrop"
            >
              <!-- Error message -->
              <div v-if="error" class="error-message">{{ error }}</div>
              
              <!-- Uploaded files list -->
              <div v-if="uploadedFiles.length > 0" class="uploaded-files">
                <div v-for="file in uploadedFiles" :key="file.id" class="file-item">
                  <div class="file-preview">
                    <img v-if="file.preview" :src="file.preview" alt="Preview" class="file-thumbnail" />
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
                <span>Drag & drop image files or click to browse</span>
                <input 
                  id="file-input" 
                  type="file" 
                  class="hidden-input" 
                  accept="image/*" 
                  multiple
                  @change="handleFileUpload" 
                />
              </label>
            </div>
          </div>
          
          <button 
            class="analyze-button"
            @click="analyzeDesign"
            aria-label="Analyze design"
            tabindex="0"
            @keydown.enter="analyzeDesign"
            :disabled="uploadedFiles.length === 0 && !content.trim()"
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
        <div class="progress-bar" v-if="scanProgress < 100">
          <div class="progress-fill" :style="{ width: `${scanProgress}%` }"></div>
        </div>
      </div>

      <!-- Chat Conversation View -->
      <div v-if="conversation.length > 0 && !isLoading" class="conversation-container">
        <div class="conversation-messages">
          <div v-for="(message, index) in conversation" :key="index" 
              class="message" 
              :class="message.role === 'user' ? 'user-message' : 'assistant-message'">
            
            <!-- User message -->
            <div v-if="message.role === 'user'" class="message-content">
              <div class="message-text">{{ message.content }}</div>
              
              <!-- Display uploaded files -->
              <div v-if="message.files && message.files.length > 0" class="message-files">
                <div v-for="file in message.files" :key="file.id" class="message-file">
                  <img v-if="file.preview" :src="file.preview" alt="User uploaded image" class="message-file-image" />
                </div>
              </div>
            </div>
            
            <!-- Assistant message -->
            <div v-else-if="!message.isLoading" class="message-content">
              <!-- Error message -->
              <div v-if="message.isError" class="assistant-error">{{ message.content }}</div>
              
              <!-- Regular response -->
              <div v-else-if="message.feedback && message.feedback[0].category === 'Response'" 
                   class="markdown-content"
                   v-html="renderMarkdown(message.feedback[0].items[0].message)"></div>
              
              <!-- Design Analysis results -->
              <div v-else-if="message.feedback" class="design-analysis-results">
                <div v-for="category in message.feedback" :key="category.category" class="analysis-category">
                  <div class="category-header">
                    <div class="category-icon" v-html="getIconForCategory(category.icon)"></div>
                    <h3 class="category-title">{{ category.category }}</h3>
                  </div>
                  
                  <div class="analysis-content">
                    <div v-for="(item, itemIndex) in category.items" :key="itemIndex" 
                        class="analysis-item">
                      <div class="analysis-item-content" v-html="renderMarkdown(item.message)"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Assistant loading indicator (simple version for chat) -->
            <div v-else class="message-content assistant-loading">
              <div class="chat-loading-indicator">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Input bar for continuing the conversation -->
        <div class="conversation-input">
          <div v-if="error" class="error-message">{{ error }}</div>
          <div class="input-container">
            <textarea 
              v-model="userInput" 
              placeholder="Ask a follow-up question..." 
              class="input-textarea"
              @keydown.enter.prevent="sendMessage"
            ></textarea>
            
            <div class="input-actions">
              <label class="upload-button" for="add-file-input">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <input 
                  id="add-file-input" 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  class="hidden-input"
                  @change="handleAdditionalFileUpload" 
                />
              </label>
              
              <button 
                class="send-button" 
                @click="sendMessage"
                aria-label="Send message"
                tabindex="0"
                @keydown.enter="sendMessage"
                :disabled="!userInput.trim() && uploadedFiles.length === 0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Uploaded files preview -->
          <div v-if="uploadedFiles.length > 0" class="uploaded-files-preview">
            <div v-for="file in uploadedFiles" :key="file.id" class="uploaded-file-preview">
              <img v-if="file.preview" :src="file.preview" alt="Preview" class="file-thumbnail-small" />
              <button 
                class="remove-preview" 
                @click="removeFile(file.id)"
                aria-label="Remove file"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </button>
            </div>
          </div>
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
  transition: width 0.3s ease, height 0.3s ease;
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

.header-actions {
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

.close-button, .expand-button {
  height: 2rem;
  width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #000;
}

.close-button:hover, .expand-button:hover {
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
  display: flex;
  flex-direction: column;
}

/* Conversation Styles */
.conversation-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.conversation-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-right: 0.5rem;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 100%;
}

.user-message {
  align-self: flex-end;
  max-width: 80%;
}

.assistant-message {
  align-self: flex-start;
  max-width: 90%;
}

.message-content {
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow: hidden;
}

.user-message .message-content {
  background-color: #FF5310;
  color: white;
  border-top-right-radius: 0;
}

.assistant-message .message-content {
  background-color: #f3f4f6;
  color: #1f2937;
  border-top-left-radius: 0;
}

.message-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.message-files {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.message-file {
  width: 100%;
  max-width: 200px;
  overflow: hidden;
  border-radius: 0.25rem;
}

.message-file-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: 0.25rem;
}

.conversation-input {
  margin-top: auto;
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.input-container {
  display: flex;
  padding: 0.5rem;
}

.input-textarea {
  flex: 1;
  border: none;
  padding: 0.5rem;
  resize: none;
  min-height: 2.5rem;
  max-height: 6rem;
  overflow-y: auto;
  font-size: 0.875rem;
  line-height: 1.25rem;
  background-color: #f9fafb;
  color: #1f2937;
  font-family: 'PP Neue Montreal', sans-serif;
}

.input-textarea:focus {
  outline: none;
}

.input-actions {
  display: flex;
  align-items: flex-end;
  padding: 0.5rem;
  gap: 0.5rem;
}

.upload-button {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  border-radius: 0.375rem;
}

.upload-button:hover {
  background-color: #f3f4f6;
  color: #FF5310;
}

.send-button {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #FF5310;
  color: white;
  border-radius: 9999px;
  cursor: pointer;
}

.send-button:hover {
  background-color: rgba(255, 83, 16, 0.9);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #9ca3af;
}

.uploaded-files-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.uploaded-file-preview {
  position: relative;
  width: 3rem;
  height: 3rem;
  border-radius: 0.25rem;
  overflow: hidden;
}

.file-thumbnail-small {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-preview {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  width: 1.25rem;
  height: 1.25rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.remove-preview:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

/* For existing styles */
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
  color: #1f2937;
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
  padding: 0.75rem;
  transition: box-shadow 0.2s;
}

.feedback-category:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.category-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #1f2937;
  font-size: 0.875rem;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  margin: 0;
  padding: 0 0 0 0.5rem;
  list-style-type: none;
}

.feedback-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding-left: 0.5rem;
  border-left: 3px solid #6b7280;
}

.feedback-item.success {
  color: #059669;
  border-left-color: #059669;
}

.feedback-item.warning {
  color: #d97706;
  border-left-color: #d97706;
}

.feedback-item.error {
  color: #dc2626;
  border-left-color: #dc2626;
}

.feedback-item.default {
  color: #6b7280;
  border-left-color: #6b7280;
}

.feedback-icon {
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.feedback-message {
  flex: 1;
}

.error-message {
  color: #ef4444;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.upload-area {
  display: flex;
  flex-direction: column;
}

.analyze-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #9ca3af;
}

/* Chat loading indicator styles */
.assistant-loading {
  min-height: 2.5rem;
  display: flex;
  align-items: center;
}

.chat-loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #9ca3af;
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.assistant-error {
  color: #dc2626;
  font-size: 0.875rem;
}

/* Uploaded files styles - ensure they're cleared after sending */
.uploaded-files-preview:empty {
  display: none;
}

.markdown-content {
  line-height: 1.5;
  color: #1f2937;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.markdown-content :deep(h1) {
  font-size: 1.25rem;
}

.markdown-content :deep(h2) {
  font-size: 1.15rem;
}

.markdown-content :deep(h3) {
  font-size: 1rem;
}

.markdown-content :deep(p) {
  margin-bottom: 1rem;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5rem;
}

.markdown-content :deep(code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875em;
}

.markdown-content :deep(pre) {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.markdown-content :deep(a) {
  color: #FF5310;
  text-decoration: underline;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 1rem;
  margin-left: 0;
  margin-right: 0;
  font-style: italic;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
  margin: 1rem 0;
}

/* Design Analysis Styles */
.design-analysis-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.analysis-category {
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.analysis-category:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.category-header {
  background-color: #f9fafb;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  background-color: rgba(255, 83, 16, 0.1);
  color: #FF5310;
  border-radius: 0.375rem;
}

.category-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #1f2937;
  margin: 0;
}

.analysis-content {
  padding: 0.75rem;
}

.analysis-item {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background-color: #fafafa;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.analysis-item:last-child {
  margin-bottom: 0;
}

.analysis-item:hover {
  background-color: #f3f4f6;
}

.analysis-item-content {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
}

.analysis-item-content :deep(p) {
  margin: 0.5rem 0;
}

.analysis-item-content :deep(p:first-child) {
  margin-top: 0;
}

.analysis-item-content :deep(p:last-child) {
  margin-bottom: 0;
}

.analysis-item-content :deep(ul),
.analysis-item-content :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}

.analysis-item-content :deep(li) {
  margin-bottom: 0.25rem;
}
</style>

