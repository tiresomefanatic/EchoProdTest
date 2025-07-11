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
          <rect x="7" y="7" width="3" height="9"/>
          <rect x="14" y="7" width="3" height="5"/>
        </svg>
        <span class="font-semibold text-black">AI Editing Assistant</span>
      </div>
    </div>

    <div class="chat-messages-area p-2 space-y-2">
      <!-- Empty state -->
      <div v-if="conversation.length === 0" class="text-center space-y-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-12 h-12 text-[#FF5310] mx-auto"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <rect x="7" y="7" width="3" height="9"/>
          <rect x="14" y="7" width="3" height="5"/>
        </svg>
        <div class="space-y-2">
          <h3 class="font-semibold text-gray-900">AI Editing Assistant</h3>
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
        </div>
        <div class="mt-4 space-y-2">
          <p class="text-xs text-gray-500">Example prompts:</p>
          <button 
            v-for="prompt in examplePrompts" 
            :key="prompt"
            @click="handleExamplePrompt(prompt)"
            class="block w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border text-gray-700"
          >
            "{{ prompt }}"
          </button>
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
              </div>
              <div v-else class="assistant-message-text">
                <div v-html="renderMarkdown(message.content)" class="markdown-content"></div>
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

    <!-- Input area -->
    <div class="border-t p-4">
      <div class="flex gap-2">
        <input
          v-model="userInput"
          type="text"
          placeholder="Describe how you'd like to edit your document..."
          class="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5310] focus:border-transparent"
          @keydown.enter="handleSendMessage"
          :disabled="isLoading"
        />
        <button
          @click="handleSendMessage"
          :disabled="isLoading || !userInput.trim()"
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

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  changes?: any[];
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
const { showToast } = useToast();

const examplePrompts = [
  "Add a best practices section with 3 key guidelines",
  "Add a section about color accessibility requirements",
  "Create a usage examples section with do's and don'ts",
  "Add a section about implementation guidelines",
  "Improve the writing style to be more concise"
];



const handleExamplePrompt = (prompt: string) => {
  userInput.value = prompt;
  handleSendMessage();
};

const handleSendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return;

  const userMessage: Message = {
    role: 'user',
    content: userInput.value.trim(),
    timestamp: new Date()
  };

  conversation.value.push(userMessage);
  const currentPrompt = userInput.value.trim();
  userInput.value = '';
  
  isLoading.value = true;
  loadingText.value = 'Analyzing your request...';

  try {
    // Update loading text
    setTimeout(() => {
      loadingText.value = 'Generating edits...';
    }, 1000);

    // Send request to AI API
    const response = await fetch('/api/ai-editing-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: currentPrompt,
        currentContent: props.currentContent || '',
        conversation: conversation.value.slice(0, -1).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
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
          title: 'No Changes Applied',
          message: 'The AI provided a response but no document changes were made. This may happen if the content was incomplete.',
          type: 'warning'
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
  height: calc(100vh - 100px); /* or 100% if parent is already sized */
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
  @apply bg-[#FF5310] text-white rounded-lg p-3;
}

.assistant-message .message-content {
  @apply bg-gray-50 rounded-lg p-3;
}

.message-header {
  @apply flex items-center justify-between text-xs font-medium;
}

.user-message .message-header {
  @apply text-white text-opacity-90;
}

.assistant-message .message-header {
  @apply text-gray-600;
}

.message-body {
  @apply mt-2;
}

.user-message-text {
  @apply text-sm;
}

.assistant-message-text {
  @apply text-sm text-gray-900;
}

.changes-applied {
  @apply mt-3 p-2 bg-green-50 rounded border border-green-200;
}

.changes-header {
  @apply flex items-center gap-2 mb-1;
}

.loading-content {
  @apply flex items-center gap-2;
}

.loading-spinner {
  @apply flex items-center justify-center;
}

.spinner {
  @apply w-4 h-4 border-2 border-gray-300 border-t-[#FF5310] rounded-full animate-spin;
}

.loading-text {
  @apply text-sm text-gray-600;
}

.markdown-content {
  @apply prose prose-sm max-w-none;
}

.markdown-content h1, .markdown-content h2, .markdown-content h3 {
  @apply font-semibold text-gray-900;
}

.markdown-content p {
  @apply text-gray-700;
}

.markdown-content ul, .markdown-content ol {
  @apply text-gray-700;
}

.markdown-content code {
  @apply bg-gray-100 px-1 py-0.5 rounded text-sm font-mono;
}

.markdown-content pre {
  @apply bg-gray-100 p-2 rounded overflow-x-auto;
}

.markdown-content pre code {
  @apply bg-transparent p-0;
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