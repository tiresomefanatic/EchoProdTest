import { createMinioClient, ensureBucketExists } from './minioClient';

/**
 * Verifies the MinIO connection and makes sure the bucket exists
 */
export const verifyMinioConnection = async (): Promise<boolean> => {
  console.log('Verifying MinIO connection...');
  
  try {
    // Get bucket name from environment
    const minioBucket = process.env.MINIO_BUCKET || 'uploads';
    
    // Create MinIO client with public endpoint for initial setup
    const client = createMinioClient(true);
    
    // Try to list buckets to check connectivity
    try {
      console.log('Checking MinIO connection by listing buckets...');
      const buckets = await client.listBuckets();
      console.log(`Connected to MinIO successfully. Found ${buckets.length} buckets.`);
      
      if (buckets.length > 0) {
        console.log('Available buckets:');
        buckets.forEach(b => console.log(` - ${b.name}`));
      }
    } catch (listError) {
      console.error('Failed to list buckets. Error:', listError);
      console.log('Attempting to proceed with bucket creation anyway...');
    }
    
    // Ensure our bucket exists
    try {
      console.log(`Ensuring bucket "${minioBucket}" exists...`);
      await ensureBucketExists(client, minioBucket);
      console.log(`Bucket "${minioBucket}" is ready for use.`);
    } catch (bucketError) {
      console.error(`Failed to ensure bucket "${minioBucket}" exists:`, bucketError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('MinIO connection verification failed:', error);
    return false;
  }
}; 