import { defineEventHandler, readMultipartFormData } from 'h3';
import { createHash } from 'crypto';
import * as Minio from 'minio';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { Readable } from 'stream';

// Promisify stream pipeline
const pipelineAsync = promisify(pipeline);

export default defineEventHandler(async (event) => {
  try {
    console.log('Upload request received');
    
    // Parse multipart form data
    const formData = await readMultipartFormData(event);
    if (!formData) {
      console.log('No form data found');
      return {
        statusCode: 400,
        message: 'No file uploaded',
      };
    }

    // Find the file part
    const filePart = formData.find((part) => part.name === 'file');
    if (!filePart) {
      console.log('No file part found in form data');
      return {
        statusCode: 400,
        message: 'No file uploaded',
      };
    }

    // Find the name part or generate a name
    const namePart = formData.find((part) => part.name === 'name');
    const fileName = namePart && namePart.data ? 
      new TextDecoder().decode(namePart.data) : 
      `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    console.log(`Processing upload for file: ${fileName}`);

    // Get MinIO bucket name from environment
    const minioBucket = process.env.MINIO_BUCKET || 'uploads';
    
    console.log(`Will upload to bucket: ${minioBucket}`);
    console.log(`Content type: ${filePart.type || 'application/octet-stream'}`);
    console.log(`File size: ${filePart.data.length} bytes`);
    
    // Generate a unique file key with a hash to avoid collisions
    const hash = createHash('md5').update(filePart.data).digest('hex').substring(0, 8);
    const fileKey = `uploads/${Date.now()}-${hash}-${fileName}`;
    
    // Multiple upload approaches - try in sequence until one works
    let uploadSuccess = false;
    let uploadError = null;
    
    // Approach 1: Try MinIO JavaScript client first
    if (!uploadSuccess) {
      try {
        console.log('Attempting upload with MinIO client...');
        
        // Import and use our configured MinIO client
        const { createMinioClient } = await import('../utils/minioClient');
        const minioClient = createMinioClient(true); // Use public endpoint for uploads
        
        // Ensure bucket exists using our utility function
        const { ensureBucketExists } = await import('../utils/minioClient');
        await ensureBucketExists(minioClient, minioBucket);

        // Convert Buffer to stream
        const fileStream = Readable.from(filePart.data);
        
        // Upload file with explicit timeout
        const uploadPromise = minioClient.putObject(
          minioBucket,
          fileKey,
          fileStream,
          filePart.data.length,
          {
            'Content-Type': filePart.type || 'application/octet-stream',
          }
        );
        
        // Add timeout to the upload
        const timeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Upload timeout')), 30000);
        });
        
        await Promise.race([uploadPromise, timeout]);
        
        console.log('MinIO client upload successful');
        uploadSuccess = true;
      } catch (error) {
        console.error('MinIO client upload failed:', error);
        uploadError = error;
      }
    }
    
    // Approach 2: Try direct HTTP request if MinIO client failed
    if (!uploadSuccess) {
      try {
        console.log('Attempting direct HTTP upload...');
        
        // Get credentials and endpoints
        const minioAccessKey = process.env.MINIO_ROOT_USER;
        const minioSecretKey = process.env.MINIO_ROOT_PASSWORD;
        
        // Use private endpoint for internal communication in production
        const isLocal = process.env.NODE_ENV === 'development' || !process.env.RAILWAY_ENVIRONMENT_NAME;
        const minioHost = isLocal
          ? process.env.MINIO_PUBLIC_HOST
          : (process.env.MINIO_PRIVATE_HOST || 'bucket.railway.internal');
        
        const minioPort = isLocal
          ? (process.env.MINIO_PUBLIC_PORT || '443')
          : (process.env.MINIO_PRIVATE_PORT || '9000');
        
        const useSSL = isLocal ? true : false;
        
        if (!minioAccessKey || !minioSecretKey || !minioHost) {
          throw new Error('MinIO configuration incomplete');
        }
        
        // Construct endpoint URL
        const protocol = useSSL ? 'https' : 'http';
        const uploadUrl = `${protocol}://${minioHost}:${minioPort}/${minioBucket}/${fileKey}`;
        console.log(`Uploading to: ${uploadUrl}`);
        
        // Create Authorization header (basic auth)
        const authHeader = `Basic ${Buffer.from(`${minioAccessKey}:${minioSecretKey}`).toString('base64')}`;
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        // Make direct request
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': filePart.type || 'application/octet-stream',
            'Authorization': authHeader,
            'Content-Length': filePart.data.length.toString(),
          },
          body: filePart.data,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP upload failed with status ${response.status}: ${errorText}`);
        }
        
        console.log('Direct HTTP upload successful');
        uploadSuccess = true;
      } catch (error) {
        console.error('Direct HTTP upload failed:', error);
        uploadError = error;
      }
    }
    
    // If both approaches failed, return error
    if (!uploadSuccess) {
      const errorMessage = uploadError instanceof Error 
        ? uploadError.message 
        : 'All upload methods failed';
      const errorDetails = uploadError instanceof Error 
        ? uploadError.stack 
        : JSON.stringify(uploadError);
      
      return {
        statusCode: 500,
        message: `Upload failed: ${errorMessage}`,
        details: errorDetails,
      };
    }
    
    // Generate a GET URL for the uploaded file
    console.log('Generating public URL for uploaded file');
    
    // For client access, always use the public endpoint
    const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT;
    
    if (!publicEndpoint) {
      console.error('Public endpoint not configured');
      return {
        statusCode: 500,
        message: 'Public endpoint not configured',
      };
    }
    
    // Construct the public URL (strip port 443 if present)
    const publicUrl = publicEndpoint.endsWith(':443') 
      ? `${publicEndpoint.replace(':443', '')}/${minioBucket}/${fileKey}`
      : `${publicEndpoint}/${minioBucket}/${fileKey}`;
    
    console.log(`Generated public URL: ${publicUrl}`);
    return {
      url: publicUrl
    };
  } catch (error) {
    console.error('Unexpected error in upload handler:', error);
    return {
      statusCode: 500,
      message: error instanceof Error ? error.message : 'An unexpected error occurred during upload',
      stack: error instanceof Error ? error.stack : undefined,
    };
  }
}); 