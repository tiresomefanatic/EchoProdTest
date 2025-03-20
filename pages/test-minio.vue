<template>
  <div class="minio-test-page">
    <h1>MinIO Connection Test</h1>
    
    <div class="test-section">
      <h2>Connection Status</h2>
      <button @click="testConnection" class="test-button" :disabled="loading">
        {{ loading ? 'Testing...' : 'Test Connection' }}
      </button>
      
      <div v-if="connectionResult" class="result-container">
        <h3>Test Results</h3>
        <pre class="result-data">{{ JSON.stringify(connectionResult, null, 2) }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h2>Upload Test</h2>
      <input 
        type="file" 
        ref="fileInput" 
        accept="image/*" 
        @change="handleFileSelect" 
        style="display: none"
      />
      <button @click="triggerFileInput" class="test-button" :disabled="uploading">
        {{ uploading ? 'Uploading...' : 'Select File to Upload' }}
      </button>
      
      <div v-if="uploadResult" class="result-container">
        <h3>Upload Result</h3>
        <div v-if="uploadResult.success">
          <p class="success-message">Upload successful!</p>
          <p>URL: <a :href="uploadResult.url" target="_blank">{{ uploadResult.url }}</a></p>
          <img v-if="uploadResult.url" :src="uploadResult.url" alt="Uploaded image" class="preview-image" />
        </div>
        <div v-else>
          <p class="error-message">Upload failed: {{ uploadResult.error }}</p>
          <pre v-if="uploadResult.details" class="error-details">{{ uploadResult.details }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMinIO } from '~/composables/useMinIO';

// State
const loading = ref(false);
const uploading = ref(false);
const connectionResult = ref(null);
const uploadResult = ref<{
  success: boolean;
  url?: string;
  error?: string;
  details?: string;
} | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const { uploadImage } = useMinIO();

// Methods
const testConnection = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/test-minio');
    connectionResult.value = await response.json();
  } catch (error) {
    console.error('Error testing connection:', error);
    connectionResult.value = {
      error: error instanceof Error ? error.message : 'Unknown error',
      time: new Date().toISOString()
    };
  } finally {
    loading.value = false;
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file) return;
  
  uploading.value = true;
  uploadResult.value = null;
  
  try {
    console.log('Starting upload test with file:', file.name);
    const url = await uploadImage(file);
    
    uploadResult.value = {
      success: true,
      url
    };
  } catch (error) {
    console.error('Upload test failed:', error);
    
    let details = '';
    if (error instanceof Error && error.cause) {
      try {
        details = JSON.stringify(error.cause, null, 2);
      } catch {
        details = String(error.cause);
      }
    }
    
    uploadResult.value = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details
    };
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
.minio-test-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #444;
}

.test-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: #f9fafb;
}

.test-button {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.test-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.test-button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.result-container {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.result-data {
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 0.875rem;
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.25rem;
  overflow-x: auto;
}

.success-message {
  color: #059669;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-message {
  color: #dc2626;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-details {
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 0.75rem;
  background-color: #fee2e2;
  padding: 0.75rem;
  border-radius: 0.25rem;
  color: #991b1b;
  overflow-x: auto;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  margin-top: 1rem;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}
</style> 