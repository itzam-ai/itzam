"use server";
import { uploadFileToBucket } from "@itzam/server/r2/server";

interface ExtendedFile extends File {
  id: string;
}

export async function uploadFileToR2(file: ExtendedFile, userId: string) {
  try {
    const data = await uploadFileToBucket(file, userId);

    return { url: data.imageUrl, id: file.id, createdAt: file.lastModified };
  } catch (error) {
    console.error("Error in uploadFileToR2:", error);
    throw error;
  }
}
