<template>
  <div class="ai-editing-assistant-sidebar">
    <div class="flex items-center justify-between border-b p-3">
      <div class="flex items-center gap-2">
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
          class="h-5 w-5 text-[#FF5310]"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <rect x="14" y="7" width="3" height="5"/>
        </svg>
        <span class="font-semibold text-black">AI Editing Assistant</span>
      </div>
    </div>

    <div class="chat-messages-area p-2 space-y-2">
      <!-- Empty state -->
      <div v-if="conversation.length === 0" class="text-center space-y-4">
        <div class="space-y-2 mt-4">
          <p class="text-sm text-gray-600">
            Tell me how you'd like to edit your document. I can help you:
          </p>
        </div>
        <div class="text-left space-y-2">
          <div class="text-sm text-gray-600">
            • Add, modify, or remove content
          </div>
          <div class="text-sm text-gray-600">
            • Restructure sections and headings
          </div>
          <div class="text-sm text-gray-600">
            • Improve writing style and tone
          </div>
          <div class="text-sm text-gray-600">
            • Format text and add HTML elements
          </div>
          <div class="text-sm text-gray-600">
            • Analyze attached images and documents
          </div>
        </div>
      </div>

      <!-- Conversation -->
      <div v-else class="space-y-4">
        <div 
          v-for="(message, index) in conversation" 
          :key="index"
          class="message"
          :class="message.role === 'user' ? 'user-message' : 'assistant-message'"
        >
          <div class="message-content">
            <div class="message-header">
              <span class="message-sender">
                {{ message.role === 'user' ? 'You' : 'AI Assistant' }}
              </span>
              <span class="message-time">
                {{ formatTime(message.timestamp) }}
              </span>
            </div>
            <div class="message-body">
              <div v-if="message.role === 'user'" class="user-message-text">
                {{ message.content }}
                <!-- Show attached files in user messages -->
                <div v-if="message.attachments && message.attachments.length > 0" class="attached-files mt-2">
                  <div class="text-xs text-white text-opacity-80 mb-1">Attached files:</div>
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-for="file in message.attachments" 
                      :key="file.name"
                      class="inline-flex items-center gap-1 text-xs bg-white bg-opacity-20 rounded px-2 py-1"
                    >
                      <svg v-if="isImageFile(file)" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                      </svg>
                      <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
                      </svg>
                      {{ file.name }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="assistant-message-text">
                <div>
                  <!-- Render summary (text before first code block) -->
                  <span v-html="renderMarkdown(message.content.split('```')[0])" class="markdown-content"></span>
                  <!-- If there is a code block, show expandable -->
                  <template v-if="message.content.includes('```')">
                    <button
                      class="show-html-btn"
                      @click="toggleExpand(index)"
                      :aria-expanded="expandedIndexes.includes(index) ? 'true' : 'false'"
                      :aria-controls="'html-block-' + index"
                      style="margin-top: 8px; margin-bottom: 8px; background: #e5e7eb; color: #1f2937; border: none; border-radius: 4px; padding: 4px 12px; cursor: pointer; font-size: 13px;"
                    >
                      {{ expandedIndexes.includes(index) ? 'Hide Raw output' : 'Show Raw output' }}
                    </button>
                    <div
                      v-show="expandedIndexes.includes(index)"
                      :id="'html-block-' + index"
                      style="background: #f0f7ff; border-radius: 6px; padding: 12px; margin-top: 4px; overflow-x: auto; font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace; font-size: 13px; color: #1e293b;"
                    >
                      <pre style="margin: 0; white-space: pre-wrap; word-break: break-all;">{{ message.content.split('```')[1] }}</pre>
                    </div>
                  </template>
                </div>
                <div v-if="message.changes" class="changes-applied">
                  <div class="changes-header">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="w-4 h-4 text-green-600"
                    >
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                    <span class="text-sm text-green-600 font-medium">Changes Applied</span>
                  </div>
                  <div class="text-xs text-gray-500">
                    Document updated with {{ message.changes.length }} change{{ message.changes.length !== 1 ? 's' : '' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="message assistant-message">
        <div class="message-content">
          <div class="message-header">
            <span class="message-sender">AI Assistant</span>
          </div>
          <div class="message-body">
            <div class="loading-content">
              <div class="loading-spinner">
                <div class="spinner"></div>
              </div>
              <span class="loading-text">{{ loadingText }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- File attachment area -->
    <div v-if="attachedFiles.length > 0" class="attached-files-section border-t p-3 bg-gray-50">
      <div class="text-xs font-medium text-gray-700 mb-2">Attached Files ({{ attachedFiles.length }})</div>
      <div class="space-y-2">
        <div 
          v-for="(file, index) in attachedFiles" 
          :key="index"
          class="flex items-center gap-2 p-2 bg-white rounded border"
        >
          <!-- File type icon -->
          <div class="flex-shrink-0">
            <img 
              v-if="isImageFile(file) && file.preview"
              :src="file.preview"
              :alt="file.name"
              class="w-8 h-8 object-cover rounded"
            />
            <svg v-else-if="isImageFile(file)" class="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
            </svg>
          </div>

          <!-- File info -->
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 truncate">{{ file.name }}</div>
            <div class="text-xs text-gray-500">{{ formatFileSize(file.size) }} • {{ getFileType(file) }}</div>
          </div>

          <!-- Remove button -->
          <button
            @click="handleRemoveFile(index)"
            class="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 rounded"
            :aria-label="`Remove ${file.name}`"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Input area -->
    <div class="border-t p-4">
      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.md,.doc,.docx"
        class="hidden"
        @change="handleFileSelect"
      />

      <!-- Text input with attachment and send buttons -->
      <div class="flex gap-2">
        <input
          v-model="userInput"
          type="text"
          placeholder="Describe how you'd like to edit your document..."
          class="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5310] focus:border-transparent bg-white text-gray-900"
          @keydown.enter="handleSendMessage"
          :disabled="isLoading"
        />
        
        <!-- Attachment button -->
        <button
          @click="triggerFileInput"
          :disabled="isLoading"
          class="px-3 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="Attach files (Images, TXT, MD, DOC, DOCX - Max 10MB each)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-4 h-4"
          >
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
          </svg>
        </button>
        
        <!-- Send button -->
        <button
          @click="handleSendMessage"
          :disabled="isLoading || (!userInput.trim() && attachedFiles.length === 0)"
          class="px-4 py-2 bg-[#FF5310] text-white rounded-md hover:bg-[#E04A0E] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-4 h-4"
          >
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineProps, defineEmits } from 'vue';
import { marked } from 'marked';
import { useToast } from '~/composables/useToast';

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  file: File;
  preview?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  changes?: any[];
  attachments?: AttachedFile[];
}

interface Props {
  currentContent?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  contentUpdate: [content: string];
}>();

const userInput = ref('');
const conversation = ref<Message[]>([]);
const isLoading = ref(false);
const loadingText = ref('Analyzing your request...');
const attachedFiles = ref<AttachedFile[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const { showToast } = useToast();

const expandedIndexes = ref<number[]>([]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'text/markdown', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

const toggleExpand = (index: number) => {
  if (expandedIndexes.value.includes(index)) {
    expandedIndexes.value = expandedIndexes.value.filter(i => i !== index);
  } else {
    expandedIndexes.value.push(index);
  }
};

const isImageFile = (file: AttachedFile | { name: string; type?: string }) => {
  return ALLOWED_IMAGE_TYPES.includes(file.type || '') || 
         /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
};

const getFileType = (file: AttachedFile) => {
  if (isImageFile(file)) return 'Image';
  if (file.type === 'application/pdf') return 'PDF';
  if (file.type === 'text/plain') return 'Text';
  if (file.type === 'text/markdown') return 'Markdown';
  if (file.type.includes('word')) return 'Word Document';
  return 'Document';
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const validateFile = (file: File): boolean => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not supported. Please select images, PDF, TXT, MD, or DOC files.`);
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
  }
  
  return true;
};

const createFilePreview = async (file: File): Promise<string | undefined> => {
  if (isImageFile({ name: file.name, type: file.type })) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }
  return undefined;
};

const addFiles = async (files: FileList | File[]) => {
  const fileArray = Array.from(files);
  
  for (const file of fileArray) {
    try {
      validateFile(file);
      
      // Check if file already attached
      if (attachedFiles.value.some(af => af.name === file.name && af.size === file.size)) {
        showToast({
          title: 'File Already Attached',
          message: `${file.name} is already attached.`,
          type: 'warning'
        });
        continue;
      }
      
      const preview = await createFilePreview(file);
      
      attachedFiles.value.push({
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        preview
      });
      
    } catch (error) {
      showToast({
        title: 'File Error',
        message: error instanceof Error ? error.message : 'Failed to attach file',
        type: 'error'
      });
    }
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    addFiles(input.files);
    input.value = ''; // Reset input
  }
};



const handleRemoveFile = (index: number) => {
  attachedFiles.value.splice(index, 1);
};

const handleSendMessage = async () => {
  if ((!userInput.value.trim() && attachedFiles.value.length === 0) || isLoading.value) return;

  const userMessage: Message = {
    role: 'user',
    content: userInput.value.trim() || 'Please analyze the attached files.',
    timestamp: new Date(),
    attachments: [...attachedFiles.value]
  };

  conversation.value.push(userMessage);
  const currentPrompt = userInput.value.trim() || 'Please analyze the attached files.';
  const currentAttachments = [...attachedFiles.value];
  
  userInput.value = '';
  attachedFiles.value = []; // Clear attachments after sending
  
  isLoading.value = true;
  loadingText.value = 'Analyzing your request...';

  try {
    // Update loading text
    setTimeout(() => {
      loadingText.value = 'Processing request...';
    }, 1000);

    // Prepare form data
    const formData = new FormData();
    formData.append('prompt', currentPrompt);
    formData.append('currentContent', props.currentContent || '');
    formData.append('conversation', JSON.stringify(
      conversation.value.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ));

    // Add files to form data
    currentAttachments.forEach((attachedFile, index) => {
      formData.append(`file_${index}`, attachedFile.file);
    });

    const response = await fetch('/api/ai-editing-assistant', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const result = await response.json();
    
    if (result.success) {
      loadingText.value = 'Applying changes...';
      
      // Apply the changes if provided
      if (result.updatedContent) {
        emit('contentUpdate', result.updatedContent);
      }

      // Add AI response to conversation
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        changes: result.changes || []
      };

      conversation.value.push(assistantMessage);

      if (result.changes && result.changes.length > 0) {
        showToast({
          title: 'Changes Applied',
          message: `Successfully applied ${result.changes.length} change${result.changes.length !== 1 ? 's' : ''} to your document.`,
          type: 'success'
        });
      } else {
        showToast({
          title: 'Analysis Complete',
          message: 'The AI has analyzed your request and files.',
          type: 'success'
        });
      }
    } else {
      throw new Error(result.error || 'Failed to process request');
    }
  } catch (error) {
    console.error('AI Editing Assistant Error:', error);
    
    // Add error message to conversation
    const errorMessage: Message = {
      role: 'assistant',
      content: 'I apologize, but I encountered an error while processing your request. Please try again or rephrase your instruction.',
      timestamp: new Date()
    };

    conversation.value.push(errorMessage);

    showToast({
      title: 'Error',
      message: 'Failed to process your editing request. Please try again.',
      type: 'error'
    });
  } finally {
    isLoading.value = false;
  }
};

const renderMarkdown = (text: string) => {
  if (!text) return '';
  try {
    return marked(text);
  } catch (err) {
    console.error('Error rendering markdown:', err);
    return text;
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
.ai-editing-assistant-sidebar {
  width: 350px;
  height: calc(100vh - 150px);
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  font-family: 'PP Neue Montreal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Make the chat messages area take only available space, scrollable, and align with content */
.chat-messages-area {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  /* Optionally set a max-height if you want to further restrict it */
}

.message {
  @apply space-y-2;
}

.user-message .message-content {
  background-color: #FF5310;
  color: white;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.assistant-message .message-content {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 500;
}

.user-message .message-header {
  color: white;
  opacity: 0.9;
}

.assistant-message .message-header {
  color: #4b5563;
}

.message-body {
  margin-top: 0.5rem;
}

.user-message-text {
  font-size: 0.875rem;
}

.assistant-message-text {
  font-size: 0.875rem;
  color: #111827;
}

.changes-applied {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background-color: #f0fdf4;
  border-radius: 0.25rem;
  border: 1px solid #bbf7d0;
}

.changes-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #d1d5db;
  border-top-color: #FF5310;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 0.875rem;
  color: #4b5563;
}

.markdown-content {
  max-width: none;
}

.markdown-content h1, .markdown-content h2, .markdown-content h3 {
  font-weight: 600;
  color: #111827;
}

.markdown-content p {
  color: #374151;
}

.markdown-content ul, .markdown-content ol {
  color: #374151;
}

.markdown-content code {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.markdown-content pre {
  background-color: #f3f4f6;
  padding: 0.5rem;
  border-radius: 0.25rem;
  overflow-x: auto;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
}

.attached-files {
  margin-top: 0.5rem;
}

.attached-files-section {
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  max-height: 200px;
  overflow-y: auto;
}

.attached-files-section .space-y-2 {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.attached-files-section .space-y-2::-webkit-scrollbar {
  width: 6px;
}

.attached-files-section .space-y-2::-webkit-scrollbar-track {
  background: #f7fafc;
}

.attached-files-section .space-y-2::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.attached-files-section .space-y-2::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}



/* File item hover effects */
.attached-files-section .flex.items-center:hover {
  background-color: #f9fafb;
  border-color: #e5e7eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
}

/* File type icons */
.attached-files-section .w-8.h-8 {
  transition: transform 0.2s ease-in-out;
}

.attached-files-section .flex.items-center:hover .w-8.h-8 {
  transform: scale(1.05);
}

/* Remove button hover effect */
.attached-files-section button:hover svg {
  transform: scale(1.1);
  transition: transform 0.2s ease-in-out;
}

/* File preview image styles */
.attached-files-section img {
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease-in-out;
}

.attached-files-section .flex.items-center:hover img {
  border-color: #FF5310;
  box-shadow: 0 1px 3px rgba(255, 83, 16, 0.2);
}

/* Loading animation for file processing */
@keyframes pulse-orange {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.uploading {
  animation: pulse-orange 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@media (max-width: 768px) {
  .ai-editing-assistant-sidebar {
    width: 100%;
    height: calc(100vh - 70px); /* Anchored to bottom, compact for mobile */
    position: fixed;
    bottom: 0;
    left: 0;
    border-left: none;
    border-top: 1px solid #e5e7eb;
    z-index: 1000;
  }
}
</style> 