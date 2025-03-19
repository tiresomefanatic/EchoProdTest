<template>
  <div class="admin-controls-container">
    <div class="settings-card">
      <div class="card-header">
        <h2 class="card-title">Bot Controls</h2>
        <p class="card-description">Configure and manage the AI assistant settings</p>
      </div>
      
      <div class="card-content">
        <!-- Basic Settings Section -->
        <div class="settings-section">
          <h3 class="section-title">Basic Settings</h3>
          
          <div class="setting-item">
            <div class="setting-label-group">
              <label for="ai-status" class="setting-label">AI Assistant Status</label>
              <div class="setting-description">Enable or disable the AI assistant</div>
            </div>
            <div class="toggle-switch">
              <input type="checkbox" id="ai-status" v-model="isAIEnabled" class="toggle-input" />
              <label for="ai-status" class="toggle-label"></label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="assistant-name" class="form-label">Assistant Name</label>
            <input id="assistant-name" type="text" class="form-input" v-model="assistantName" />
          </div>
          
          <div class="form-group">
            <label for="welcome-message" class="form-label">Welcome Message</label>
            <textarea
              id="welcome-message"
              class="form-textarea"
              rows="3"
              v-model="welcomeMessage"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="chat-history" class="form-label">Chat History Retention</label>
            <div class="select-wrapper">
              <select id="chat-history" class="form-select" v-model="chatHistoryRetention">
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
              </select>
              <div class="select-arrow"></div>
            </div>
          </div>
        </div>
        
        <!-- Model Configuration Section -->
        <div class="settings-section">
          <h3 class="section-title">Model Configuration</h3>
          
          <div class="form-group">
            <label for="model-selection" class="form-label">AI Model</label>
            <div class="select-wrapper">
              <select id="model-selection" class="form-select" v-model="model">
                <option value="gpt-4o-mini">GPT-4o-mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-opus">Claude 3.7 Sonnet</option>
                <option value="claude-3-sonnet">Claude 3.7 Sonnet Thinking</option>
              </select>
              <div class="select-arrow"></div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="temperature-slider" class="form-label">Temperature: {{ temperature }}</label>
            <input 
              type="range" 
              id="temperature-slider" 
              class="form-slider" 
              min="0.1" 
              max="1" 
              step="0.01" 
              v-model="temperature" 
            />
            <p class="form-help-text">
              Controls randomness: Lower values make responses more focused and deterministic, higher values make
              responses more creative and varied.
            </p>
          </div>
          
          <div class="form-group">
            <label for="max-tokens" class="form-label">Maximum Response Length</label>
            <input
              id="max-tokens"
              type="number"
              class="form-input"
              v-model="maxTokens"
            />
            <p class="form-help-text">
              Maximum number of tokens (words and punctuation) the AI can generate in a response.
            </p>
          </div>
          
          <div class="form-group">
            <label for="system-prompt" class="form-label">System Prompt</label>
            <textarea
              id="system-prompt"
              class="form-textarea"
              v-model="systemPrompt"
              rows="5"
            ></textarea>
            <p class="form-help-text">
              Instructions that define how the AI assistant behaves and responds.
            </p>
          </div>
        </div>
        
        <!-- Security & Access Section -->
        <div class="settings-section">
          <h3 class="section-title">Security & Access</h3>
          
          <div class="setting-item">
            <div class="setting-label-group">
              <label for="content-filtering" class="setting-label">Content Filtering</label>
              <div class="setting-description">Filter out harmful or inappropriate content</div>
            </div>
            <div class="toggle-switch">
              <input type="checkbox" id="content-filtering" v-model="contentFiltering" class="toggle-input" />
              <label for="content-filtering" class="toggle-label"></label>
            </div>
          </div>
          
          <div class="setting-item">
            <div class="setting-label-group">
              <label for="require-authentication" class="setting-label">Require Authentication</label>
              <div class="setting-description">Only allow authenticated users to access the AI assistant</div>
            </div>
            <div class="toggle-switch">
              <input type="checkbox" id="require-authentication" v-model="requireAuth" class="toggle-input" />
              <label for="require-authentication" class="toggle-label"></label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="access-level" class="form-label">Access Level</label>
            <div class="select-wrapper">
              <select id="access-level" class="form-select" v-model="accessLevel">
                <option value="public">Public (Anyone)</option>
                <option value="team">Team Members Only</option>
                <option value="admin">Administrators Only</option>
              </select>
              <div class="select-arrow"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Info Cards -->
      <div class="info-cards">
        <div class="alert">
          <ZapIcon class="alert-icon" />
          <div class="alert-content">
            <h4 class="alert-title">Model Performance</h4>
            <p class="alert-description">
              The current model ({{ model }}) is optimized for design system assistance. Changing models may affect response
              quality and latency.
            </p>
          </div>
        </div>
        
        <div class="alert security-alert">
          <ShieldIcon class="alert-icon" />
          <div class="alert-content">
            <h4 class="alert-title">Security Notice</h4>
            <p class="alert-description">
              Ensure your security settings comply with your organization's data protection policies and relevant
              regulations.
            </p>
          </div>
        </div>
      </div>
      
      <div class="card-footer">
        <button class="restart-button" @click="handleRestartBot" :disabled="isRestarting">
          <RefreshCwIcon v-if="isRestarting" class="button-icon spinning" />
          <RefreshCwIcon v-else class="button-icon" />
          {{ isRestarting ? 'Restarting...' : 'Restart Bot' }}
        </button>
        <button class="save-button" @click="handleSaveSettings" :disabled="isSaving">
          <SaveIcon v-if="!isSaving" class="button-icon" />
          <RefreshCwIcon v-else class="button-icon spinning" />
          {{ isSaving ? 'Saving...' : 'Save Settings' }}
        </button>
      </div>
    </div>
    
    <div class="status-card">
      <BotIcon class="status-icon" />
      <div class="status-text">
        <div class="status-title">Bot Status</div>
        <div class="status-description">
          {{ isAIEnabled ? 'The AI assistant is currently active and responding to user queries.' : 'The AI assistant is currently disabled.' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { 
  Save as SaveIcon, 
  RefreshCw as RefreshCwIcon, 
  Bot as BotIcon, 
  Zap as ZapIcon, 
  Shield as ShieldIcon
} from 'lucide-vue-next';

// State
const isAIEnabled = ref(true);
const assistantName = ref("Echo Design Assistant");
const welcomeMessage = ref("Hello! I'm the Echo Design Assistant. How can I help you with the Echo design system today?");
const chatHistoryRetention = ref("30");
const temperature = ref(0.7);
const maxTokens = ref(2048);
const model = ref("gpt-4o-mini");
const systemPrompt = ref(
  "You are Hero Vida's AI-powered assistant for the Echo design system. You help users understand and implement the Echo design system in their projects. You provide guidance on typography, colors, components, and best practices."
);
const contentFiltering = ref(true);
const requireAuth = ref(true);
const accessLevel = ref("team");
const isSaving = ref(false);
const isRestarting = ref(false);

// Methods
const handleSaveSettings = () => {
  isSaving.value = true;
  // Simulate API call
  setTimeout(() => {
    isSaving.value = false;
  }, 1500);
};

const handleRestartBot = () => {
  isRestarting.value = true;
  // Simulate API call
  setTimeout(() => {
    isRestarting.value = false;
  }, 2000);
};
</script>

<style scoped>
.admin-controls-container {
  width: 100%;
}

.settings-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.card-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.form-input, .form-textarea, .form-select {
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #111827;
  background-color: white;
  width: 100%;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #FF5310;
  box-shadow: 0 0 0 1px rgba(255, 83, 16, 0.2);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-help-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.form-slider {
  width: 100%;
  height: 0.5rem;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e7eb;
  border-radius: 9999px;
  outline: none;
}

.form-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: #FF5310;
  cursor: pointer;
}

.form-slider::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: #FF5310;
  cursor: pointer;
  border: none;
}

.select-wrapper {
  position: relative;
}

.form-select {
  appearance: none;
  padding-right: 2rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-label-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.setting-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.setting-description {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 3rem;
  height: 1.5rem;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e5e7eb;
  transition: .4s;
  border-radius: 9999px;
}

.toggle-label:before {
  position: absolute;
  content: "";
  height: 1.25rem;
  width: 1.25rem;
  left: 0.125rem;
  bottom: 0.125rem;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.toggle-input:checked + .toggle-label {
  background-color: #FF5310;
}

.toggle-input:checked + .toggle-label:before {
  transform: translateX(1.5rem);
}

/* Buttons */
.save-button, .restart-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-button {
  background-color: #FF5310;
  color: white;
  border: none;
}

.save-button:hover:not(:disabled) {
  background-color: rgba(255, 83, 16, 0.9);
}

.restart-button {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.restart-button:hover:not(:disabled) {
  background-color: #f9fafb;
}

.save-button:disabled, .restart-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-icon {
  width: 1rem;
  height: 1rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

/* Info Cards */
.info-cards {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert {
  display: flex;
  gap: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background-color: #f9fafb;
}

.security-alert {
  background-color: rgba(255, 83, 16, 0.05);
  border-color: rgba(255, 83, 16, 0.2);
}

.alert-icon {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
  flex-shrink: 0;
  margin-top: 0.125rem;
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

/* Status Card */
.status-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background-color: white;
}

.status-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #FF5310;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.status-text {
  flex: 1;
}

.status-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.status-description {
  font-size: 0.875rem;
  color: #6b7280;
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