import { S3Client } from '@aws-sdk/client-s3';

/**
 * Creates and configures an S3 client for MinIO
 * @param forcePublic Force the use of public endpoints even in server environment
 * @returns Configured S3Client instance
 */
export function createS3Client(forcePublic = false): S3Client {
  // Check if we're running locally or on Railway
  const isLocal = process.env.NODE_ENV === 'development' || !process.env.RAILWAY_ENVIRONMENT_NAME;
  
  // Set the host and port based on environment
  // If running locally or forcePublic is true, use the public endpoint
  const minioHost = (isLocal || forcePublic) 
    ? process.env.MINIO_PUBLIC_HOST 
    : (process.env.MINIO_PRIVATE_HOST || 'bucket.railway.internal');
  
  const minioPort = (isLocal || forcePublic) 
    ? (process.env.MINIO_PUBLIC_PORT || '443') 
    : (process.env.MINIO_PRIVATE_PORT || '9000');
  
  const useSSL = (isLocal || forcePublic) 
    ? true 
    : false; // Use HTTP for internal Railway communication, HTTPS for public

  // Get MinIO credentials
  const minioAccessKey = process.env.MINIO_ROOT_USER;
  const minioSecretKey = process.env.MINIO_ROOT_PASSWORD;

  if (!minioAccessKey || !minioSecretKey || !minioHost) {
    console.error('MinIO configuration is incomplete');
    throw new Error('MinIO configuration is incomplete');
  }

  // Configure S3 client
  const endpoint = `${useSSL ? 'https' : 'http'}://${minioHost}:${minioPort}`;
  console.log(`Creating S3 client with endpoint: ${endpoint}`);
  
  // S3 client configuration
  const s3Config = {
    region: 'us-east-1', // MinIO doesn't use regions but S3 client requires one
    endpoint,
    credentials: {
      accessKeyId: minioAccessKey,
      secretAccessKey: minioSecretKey,
    },
    forcePathStyle: true, // Needed for MinIO
    customUserAgent: 'MinIOApp/1.0.0',
  };

  return new S3Client(s3Config);
} 