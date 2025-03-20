import { defineEventHandler } from "h3";
import { createMinioClient } from "../../utils/minioClient";

export default defineEventHandler(async (event) => {
  try {
    const minioClient = createMinioClient(true); // Use public endpoint
    const minioBucket = process.env.MINIO_BUCKET || "uploads";

    // List all objects in the bucket
    const stream = minioClient.listObjects(minioBucket, "", true);
    const objects: any[] = [];

    // Convert stream to array of objects
    for await (const obj of stream) {
      // Get presigned URL for the object
      const url = await minioClient.presignedGetObject(
        minioBucket,
        obj.name,
        24 * 60 * 60
      ); // 24 hour expiry

      objects.push({
        name: obj.name,
        url: url,
        size: obj.size,
        uploadDate: obj.lastModified.toISOString(),
      });
    }

    // Sort by upload date, newest first
    objects.sort(
      (a, b) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

    return {
      statusCode: 200,
      images: objects,
    };
  } catch (error) {
    console.error("Error listing images:", error);
    return {
      statusCode: 500,
      message: error instanceof Error ? error.message : "Failed to list images",
    };
  }
});
