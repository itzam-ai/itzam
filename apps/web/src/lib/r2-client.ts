"use server";
import { uploadFileToBucket } from "@itzam/server/r2/server";

export async function uploadFileToR2(
  file: File,
  fileId: string,
  userId: string
) {
  try {
    const data = await uploadFileToBucket(file, userId);

    return { url: data.imageUrl, id: fileId, createdAt: file.lastModified };
  } catch (error) {
    console.error("Error in uploadFileToR2:", error);
    throw error;
  }
}
