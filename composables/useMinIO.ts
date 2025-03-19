import { ref } from 'vue';
import { useRuntimeConfig } from 'nuxt/app';

/**
 * Fetch with timeout and retry logic
 */
const fetchWithRetry = async (
  url: string, 
  options: RequestInit, 
  maxRetries = 2,
  timeout = 30000
): Promise<Response> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${maxRetries}...`);
        // Exponential backoff with jitter
        const delay = Math.min(1000 * 2 ** attempt, 10000) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1} failed:`, error);
      
      // If this was an abort error (timeout), no need to retry
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request timed out. The server might be overloaded, please try again later.');
      }
    }
  }
  
  // All retries failed
  throw lastError || new Error('Request failed after multiple attempts');
};

interface StoredImage {
  url: string;
  name: string;
  uploadDate: string;
  size: number;
}

export const useMinIO = () => {
  const isUploading = ref(false);
  const uploadProgress = ref(0);
  const error = ref<string | null>(null);
  const storedImages = ref<StoredImage[]>([]);
  const isLoading = ref(false);
  const config = useRuntimeConfig();

  /**
   * Uploads an image to MinIO and returns the URL to the uploaded image
   * @param file The file to upload
   * @returns A promise that resolves to the URL of the uploaded image
   */
  const uploadImage = async (file: File): Promise<string> => {
    if (!file) {
      throw new Error('No file provided');
    }
    
    isUploading.value = true;
    uploadProgress.value = 0;
    error.value = null;
    
    try {
      console.log('Starting upload to MinIO...');
      console.log(`File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
      
      // Create form data for the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Get the current timestamp and file extension for unique naming
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      
      formData.append('name', uniqueFileName);
      
      // Get the upload endpoint from runtime config or use default
      const uploadEndpoint = config.public.minioUploadEndpoint || '/api/upload';
      
      console.log(`Using upload endpoint: ${uploadEndpoint}`);
      
      // Make the API call with retry logic
      const response = await fetchWithRetry(
        uploadEndpoint, 
        {
          method: 'POST',
          body: formData,
        },
        2,  // 2 retries
        60000 // 60-second timeout
      );
      
      // Capture the raw response for debugging
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error(`Server returned invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        let errorMessage = `Upload failed with status: ${response.status}`;
        
        if (data && typeof data === 'object' && 'message' in data) {
          errorMessage = data.message as string || errorMessage;
        }
        
        const uploadError = new Error(errorMessage);
        // @ts-ignore
        uploadError.cause = data;
        throw uploadError;
      }
      
      console.log('Upload response:', data);
      
      // Validate URL in response
      if (!data || !data.url) {
        console.error('Server response missing URL property:', data);
        throw new Error('Upload succeeded but no URL was returned from the server');
      }
      
      // Ensure URL has a protocol
      let imageUrl = data.url;
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        imageUrl = `https://${imageUrl}`;
        console.log(`Added protocol to URL: ${imageUrl}`);
      }
      
      // Return the URL to the uploaded file
      uploadProgress.value = 100;
      console.log(`Upload successful. Image URL: ${imageUrl}`);
      return imageUrl;
    } catch (err) {
      console.error('MinIO upload error:', err);
      
      if (err instanceof DOMException && err.name === 'AbortError') {
        error.value = 'Upload timed out. Please try again or use a smaller file.';
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to upload image to MinIO';
      }
      
      throw err;
    } finally {
      isUploading.value = false;
    }
  };

  const listStoredImages = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetchWithRetry('/api/images/list', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();
      storedImages.value = data.images;
    } catch (e) {
      console.error('Error fetching images:', e);
      error.value = e instanceof Error ? e.message : 'Failed to fetch images';
    } finally {
      isLoading.value = false;
    }
  };

  // Load images when the composable is initialized
  if (process.client) {
    listStoredImages();
  }

  return {
    uploadImage,
    isUploading,
    uploadProgress,
    error,
    storedImages,
    isLoading,
    listStoredImages,
  };
}; 