<script setup lang="ts">
import { ref, computed, onMounted, defineProps, defineEmits } from 'vue';
import { useToast } from '~/composables/useToast';

interface APIResponse {
  success: boolean;
  enhancedText?: string;
  error?: string;
  fallback?: boolean;
  actionType?: string;
  originalText?: string;
}

interface Props {
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
  onReplaceText: (newText: string) => void;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  replaceText: [newText: string];
}>();

// No tabs needed - only writing functionality
const isLoading = ref(false);
const userInput = ref('');
const messages = ref([]);
const suggestions = ref([]);
const customInput = ref(null);

// AI Enhancement Prompts
const enhancementPrompts = {
  "improve": `Please improve the following text by making it clearer, more engaging, and better structured while maintaining its original meaning and tone. Focus on:
- Enhancing clarity and readability
- Improving word choice and flow
- Fixing any grammatical issues
- Making it more compelling
- Maintaining the original length and message

Text to improve: "{TEXT}"

Provide only the improved version without explanations.`,

  "shorten": `Please shorten the following text while preserving all key information and maintaining clarity. Focus on:
- Removing redundant words and phrases
- Combining sentences where appropriate
- Eliminating unnecessary details
- Keeping the core message intact
- Making it more concise and punchy

Text to shorten: "{TEXT}"

Provide only the shortened version without explanations.`,

  "professional": `Please rewrite the following text in a professional, formal tone suitable for business communication. Focus on:
- Using professional vocabulary and terminology
- Maintaining formal sentence structure
- Removing casual language and slang
- Ensuring appropriate business tone
- Making it suitable for workplace communication

Text to make professional: "{TEXT}"

Provide only the professional version without explanations.`,

  "simplify": `Please simplify the following text to make it easier to understand while keeping the same meaning. Focus on:
- Using simpler, everyday vocabulary
- Breaking down complex sentences
- Removing jargon and technical terms
- Making it accessible to a broader audience
- Maintaining clarity and completeness

Text to simplify: "{TEXT}"

Provide only the simplified version without explanations.`
};

const quickActions = [
  { id: 'improve', label: 'Improve', icon: '🪄' },
  { id: 'shorten', label: 'Shorten', icon: '➖' },
  { id: 'professional', label: 'Professional', icon: 'T' },
  { id: 'simplify', label: 'Simplify', icon: '⚡' }
];

const handleQuickAction = async (actionId: string) => {
  if (!enhancementPrompts[actionId]) {
    console.error(`No prompt found for action: ${actionId}`);
    return;
  }

  isLoading.value = true;
  
  try {
    // Get the prompt template and replace the placeholder with actual text
    const prompt = enhancementPrompts[actionId].replace('{TEXT}', props.selectedText);
    
    // Call the AI API
    await callAIAPI(actionId, prompt);
    
  } catch (error) {
    console.error('Error processing AI request:', error);
    // Show error state or fallback
    isLoading.value = false;
  }
};

const { showToast } = useToast();

const callAIAPI = async (actionId: string, prompt: string) => {
  try {
    // Call the AI enhancement API
    const response = await $fetch<APIResponse>('/api/ai-enhance', {
      method: 'POST',
      body: {
        prompt,
        selectedText: props.selectedText,
        actionType: actionId
      }
    });
    
    if (response?.success && response.enhancedText) {
      suggestions.value = [{
        id: Date.now(),
        text: response.enhancedText,
        action: actionId,
        label: quickActions.find(a => a.id === actionId)?.label || 'Enhanced',
        prompt: prompt
      }];
    } else {
      throw new Error(response?.error || 'Failed to enhance text');
    }
    
  } catch (error: any) {
    console.error('AI Enhancement Error:', error);
    
    // Show error message
    showToast({
      title: "AI Enhancement Failed",
      message: error?.data?.message || error?.message || "Please check your API key configuration and try again.",
      type: "error",
    });
    
    // Fallback to mock processing if API fails
    let enhancedText = props.selectedText;
    
    switch (actionId) {
      case 'improve':
        enhancedText = improveText(props.selectedText);
        break;
      case 'shorten':
        enhancedText = shortenText(props.selectedText);
        break;
      case 'professional':
        enhancedText = makeProfessional(props.selectedText);
        break;
      case 'simplify':
        enhancedText = simplifyText(props.selectedText);
        break;
      default:
        enhancedText = props.selectedText;
    }
    
    suggestions.value = [{
      id: Date.now(),
      text: enhancedText + " (Fallback mode - API unavailable)",
      action: actionId,
      label: (quickActions.find(a => a.id === actionId)?.label || 'Enhanced') + ' (Offline)',
      prompt: prompt
    }];
  }
  
  isLoading.value = false;
};

// Improved mock functions with better logic
const improveText = (text: string): string => {
  return text
    .replace(/\b(good|ok|okay)\b/gi, 'excellent')
    .replace(/\b(bad|poor)\b/gi, 'suboptimal')
    .replace(/\b(big)\b/gi, 'significant')
    .replace(/\b(small)\b/gi, 'modest')
    .replace(/\s+/g, ' ')
    .replace(/\.\s+/g, '. ')
    .trim();
};

const shortenText = (text: string): string => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length <= 1) {
    // For single sentence, remove redundant words
    return text
      .replace(/\b(very|really|quite|rather|somewhat|actually)\s+/gi, '')
      .replace(/\b(in order to)\b/gi, 'to')
      .replace(/\b(due to the fact that)\b/gi, 'because')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // For multiple sentences, take the most important ones (first and last typically)
  const shortened = sentences.slice(0, Math.ceil(sentences.length * 0.7)).join('. ');
  return shortened + (shortened.endsWith('.') ? '' : '.');
};

const makeProfessional = (text: string): string => {
  return text
    .replace(/\b(can't|won't|don't|isn't|aren't)\b/gi, match => match.replace("'", ' not'))
    .replace(/\b(gonna|wanna|gotta)\b/gi, match => {
      const replacements = { gonna: 'going to', wanna: 'want to', gotta: 'have to' };
      return replacements[match.toLowerCase()] || match;
    })
    .replace(/\b(stuff|things)\b/gi, 'items')
    .replace(/\b(get)\b/gi, 'obtain')
    .replace(/\b(help)\b/gi, 'assist')
    .replace(/\b(show)\b/gi, 'demonstrate')
    .replace(/\b(use)\b/gi, 'utilize')
    .trim();
};

const simplifyText = (text: string): string => {
  return text
    .replace(/\b(utilize|utilise)\b/gi, 'use')
    .replace(/\b(demonstrate)\b/gi, 'show')
    .replace(/\b(facilitate)\b/gi, 'help')
    .replace(/\b(assistance)\b/gi, 'help')
    .replace(/\b(obtain)\b/gi, 'get')
    .replace(/\b(endeavor|endeavour)\b/gi, 'try')
    .replace(/\b(subsequently)\b/gi, 'then')
    .replace(/\b(consequently)\b/gi, 'so')
    .replace(/\b(therefore)\b/gi, 'so')
    .trim();
};

const handleCustomPrompt = async () => {
  if (!userInput.value.trim()) return;
  
  isLoading.value = true;
  
  try {
    // Create custom prompt
    const customPrompt = `Please modify the following text according to this instruction: "${userInput.value.trim()}"

Text to modify: "${props.selectedText}"

Provide only the modified version without explanations.`;

    // Call the AI API for custom prompt
    await callAIAPI('custom', customPrompt);
    userInput.value = ''; // Clear the input after successful submission
    
  } catch (error) {
    console.error('Error processing custom AI request:', error);
    isLoading.value = false;
  }
};



const handleApplySuggestion = (suggestion: any) => {
  emit('replaceText', suggestion.text);
  handleClose();
};

const handleClose = () => {
  emit('close');
};

const focusCustomInput = () => {
  if (customInput.value) {
    customInput.value.focus();
  }
};

// Position the modal near the selected text
const modalStyle = computed(() => {
  const { x, y } = props.position;
  return {
    position: 'fixed' as const,
    left: `${Math.max(10, Math.min(x - 200, window.innerWidth - 420))}px`,
    top: `${Math.max(10, y - 300)}px`,
    zIndex: '1000'
  };
});
</script>

<template>
  <div 
    class="enhance-modal"
    :style="modalStyle"
  >
    <div class="modal-header">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div class="ai-icon">
            🪄
          </div>
          <h3 class="modal-title">AI Assistant</h3>
        </div>
        <button @click="handleClose" class="close-button">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="modal-body">
      <!-- Selected text preview -->
      <div class="selected-text-preview">
        <div class="selected-text">{{ selectedText }}</div>
      </div>

      <!-- AI Writing Assistant -->
      <div class="tab-content">
        <!-- Quick Actions -->
        <div class="quick-actions">
          <div class="action-buttons">
            <button
              v-for="action in quickActions"
              :key="action.id"
              @click="handleQuickAction(action.id)"
              class="action-button"
              :disabled="isLoading"
            >
              <span class="action-icon">{{ action.icon }}</span>
              <span class="action-label">{{ action.label }}</span>
            </button>
          </div>
        </div>

        <!-- Custom Prompt -->
        <div class="custom-prompt">
          <div class="custom-prompt-container">
            <div class="custom-prompt-icon">T</div>
            <input
              ref="customInput"
              v-model="userInput"
              placeholder="Custom prompt..."
              class="custom-prompt-input"
              @keyup.enter="handleCustomPrompt"
              :disabled="isLoading"
            />
            <button
              @click="handleCustomPrompt"
              :disabled="!userInput.trim() || isLoading"
              class="custom-prompt-send"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
        </div>
      </div>



      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="flex items-center justify-center py-4">
          <svg class="w-6 h-6 animate-spin text-[#FF5310] mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span class="text-sm text-gray-600">Processing...</span>
        </div>
      </div>

      <!-- Suggestions -->
      <div v-if="suggestions.length > 0" class="suggestions">
        <div class="suggestion-list">
          <div
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="suggestion-item"
          >
            <div class="suggestion-header">
              <span class="suggestion-label">{{ suggestion.label }}</span>
            </div>
            <div class="suggestion-text">{{ suggestion.text }}</div>
            <div class="suggestion-actions">
              <button
                @click="handleApplySuggestion(suggestion)"
                class="apply-button"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.enhance-modal {
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ai-icon {
  width: 32px;
  height: 32px;
  background: #FF5310;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-right: 8px;
}

.modal-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-button {
  padding: 0.25rem;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-button:hover {
  background: #e5e7eb;
  color: #374151;
}



.modal-body {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
  max-height: 500px;
}

.selected-text-preview {
  margin-bottom: 1rem;
}

.selected-text {
  padding: 1rem;
  background: #e1f0ff;
  border-radius: 8px;
  border: 1px solid #d1e7dd;
  font-size: 0.875rem;
  color: #2563eb;
  margin-bottom: 1rem;
  max-height: 80px;
  overflow-y: auto;
  font-family: monospace;
}

.quick-actions {
  margin-bottom: 1.5rem;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.action-button {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.action-button:hover:not(:disabled) {
  border-color: #FF5310;
  background: #FF5310/5;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  font-size: 1.25rem;
}

.action-label {
  font-size: 0.75rem;
  color: #374151;
  text-align: center;
}

.custom-prompt {
  margin-top: 1rem;
}

.custom-prompt-container {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  gap: 0.75rem;
}

.custom-prompt-icon {
  width: 24px;
  height: 24px;
  background: #6b7280;
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.custom-prompt-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.875rem;
  color: #6b7280;
  padding: 0;
}

.custom-prompt-input::placeholder {
  color: #9ca3af;
}

.custom-prompt-send {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  background: #FF5310;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.custom-prompt-send:hover:not(:disabled) {
  background: #e0440a;
  transform: translateY(-1px);
}

.custom-prompt-send:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}



.suggestions {
  margin-top: 1rem;
}

.suggestion-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: white;
}

.suggestion-header {
  margin-bottom: 0.5rem;
}

.suggestion-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #FF5310;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.suggestion-text {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
  margin-bottom: 0.75rem;
  max-height: 120px;
  overflow-y: auto;
}

.suggestion-actions {
  display: flex;
  justify-content: flex-end;
}

.apply-button {
  padding: 0.5rem 1rem;
  background: #FF5310;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.apply-button:hover {
  background: #e0440a;
}

.loading-state {
  margin: 1rem 0;
  text-align: center;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .enhance-modal {
    width: 90vw;
    max-width: 350px;
  }
  
  .action-buttons {
    grid-template-columns: 1fr 1fr;
  }
  
  .prompt-input-group {
    flex-direction: column;
  }
}
</style> 