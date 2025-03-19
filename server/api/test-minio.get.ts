import { defineEventHandler } from 'h3';
import { verifyMinioConnection } from '../utils/verifyMinioConnection';
import { createMinioClient } from '../utils/minioClient';

export default defineEventHandler(async () => {
  try {
    console.log('Testing MinIO connection...');
    
    // Check connectivity
    const isConnected = await verifyMinioConnection();
    
    // Try to get more details
    let bucketDetails = [];
    
    try {
      // First try with server-side settings
      console.log('Testing with server settings');
      const serverClient = createMinioClient(false);
      const serverBuckets = await serverClient.listBuckets();
      bucketDetails.push({
        type: 'server',
        bucketsFound: serverBuckets.length,
        bucketNames: serverBuckets.map(b => b.name)
      });
    } catch (serverError) {
      console.error('Server client test failed:', serverError);
      bucketDetails.push({
        type: 'server',
        error: serverError instanceof Error ? serverError.message : 'Unknown error',
      });
    }
    
    try {
      // Then try with public settings
      console.log('Testing with public settings');
      const publicClient = createMinioClient(true);
      const publicBuckets = await publicClient.listBuckets();
      bucketDetails.push({
        type: 'public',
        bucketsFound: publicBuckets.length,
        bucketNames: publicBuckets.map(b => b.name)
      });
    } catch (publicError) {
      console.error('Public client test failed:', publicError);
      bucketDetails.push({
        type: 'public',
        error: publicError instanceof Error ? publicError.message : 'Unknown error',
      });
    }
    
    // Return relevant details
    return {
      isConnected,
      time: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        railwayEnv: process.env.RAILWAY_ENVIRONMENT_NAME || 'not set'
      },
      configDetails: {
        bucket: process.env.MINIO_BUCKET,
        publicEndpoint: process.env.MINIO_PUBLIC_ENDPOINT,
        publicBucket: process.env.MINIO_PUBLIC_BUCKET
      },
      bucketDetails
    };
  } catch (error) {
    console.error('MinIO test error:', error);
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      time: new Date().toISOString()
    };
  }
}); 