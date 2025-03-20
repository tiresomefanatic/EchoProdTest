import { verifyMinioConnection } from '../utils/verifyMinioConnection';

export default defineNitroPlugin(() => {
  console.log('Initializing MinIO connection in background...');
  
  // Run verification in a separate "thread" to avoid blocking server startup
  setTimeout(() => {
    verifyMinioConnection()
      .then(success => {
        if (success) {
          console.log('✅ MinIO connection verified and ready for use');
        } else {
          console.warn('⚠️ MinIO connection verification failed. Upload functionality may be limited.');
          console.warn('   The application will attempt to use alternative upload methods if needed.');
        }
      })
      .catch(error => {
        console.error('MinIO initialization error:', error);
        console.warn('⚠️ MinIO initialization encountered an error. Upload functionality may be limited.');
        console.warn('   The application will attempt to use alternative upload methods if needed.');
      });
  }, 2000); // Delay initialization to let the server start first
}); 