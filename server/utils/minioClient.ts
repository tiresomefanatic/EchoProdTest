import * as Minio from "minio";

/**
 * Creates and configures a MinIO client
 * @param forcePublic Force the use of public endpoints even in server environment
 * @returns Configured Minio.Client instance
 */
export function createMinioClient(forcePublic = false): Minio.Client {
  // Use public endpoint when forcePublic is true or in development
  const usePublic = forcePublic || process.env.NODE_ENV === "development";

  // Get the appropriate endpoint based on environment
  const minioHost = usePublic
    ? process.env.MINIO_PUBLIC_HOST
    : process.env.MINIO_PRIVATE_HOST;

  const minioPort = parseInt(
    usePublic
      ? process.env.MINIO_PUBLIC_PORT || "443"
      : process.env.MINIO_PRIVATE_PORT || "9000"
  );

  // Use SSL for public endpoint, HTTP for private
  const useSSL = usePublic ? true : false;

  if (!minioHost) {
    throw new Error("MinIO host configuration is missing");
  }

  // Get MinIO credentials
  const minioAccessKey = process.env.MINIO_ROOT_USER;
  const minioSecretKey = process.env.MINIO_ROOT_PASSWORD;

  if (!minioAccessKey || !minioSecretKey || !minioHost) {
    console.error("MinIO configuration is incomplete");
    throw new Error("MinIO configuration is incomplete");
  }

  // Configure MinIO client for Railway
  console.log(
    `Creating MinIO client with endpoint: ${minioHost}:${minioPort} (SSL: ${useSSL})`
  );

  const minioClient = new Minio.Client({
    endPoint: minioHost,
    port: minioPort,
    useSSL: useSSL,
    accessKey: minioAccessKey,
    secretKey: minioSecretKey,
    region: "us-east-1", // Default region for Railway MinIO
    pathStyle: true, // Use path-style URLs for compatibility
    transportOptions: {
      timeout: 30000, // 30 second timeout
      keepAlive: true,
      keepAliveMsecs: 1000,
      agent: undefined, // Let MinIO handle agent creation
    },
  });

  return minioClient;
}

/**
 * Ensures that a bucket exists, creating it if necessary
 * @param client MinIO client
 * @param bucketName Name of the bucket to check/create
 * @returns Promise that resolves when the bucket exists
 */
export async function ensureBucketExists(
  client: Minio.Client,
  bucketName: string
): Promise<void> {
  try {
    // Check if bucket exists
    const exists = await client.bucketExists(bucketName);
    if (exists) {
      console.log(`Bucket '${bucketName}' already exists`);
    } else {
      // Create bucket if it doesn't exist
      console.log(`Creating bucket '${bucketName}'...`);
      await client.makeBucket(bucketName, "us-east-1");
      console.log(`Bucket '${bucketName}' created successfully`);
    }

    // Always set public read/write policy for the bucket
    console.log(
      `Setting public read/write policy for bucket '${bucketName}'...`
    );
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
          Resource: [
            `arn:aws:s3:::${bucketName}/*`,
            `arn:aws:s3:::${bucketName}`,
          ],
        },
      ],
    };

    await client.setBucketPolicy(bucketName, JSON.stringify(policy));
    console.log(`Public read/write policy set for bucket '${bucketName}'`);
  } catch (error) {
    console.error(`Error ensuring bucket '${bucketName}' exists:`, error);
    throw error;
  }
}
