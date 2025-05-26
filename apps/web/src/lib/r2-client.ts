import { supabase } from "@itzam/supabase/client";

export async function uploadFileToR2(
  file: File,
  fileId: string,
  userId: string
) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No session found");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    const response = await supabase.functions.invoke("upload-file", {
      body: formData,
    });

    return {
      url: response.data.imageUrl,
      id: fileId,
      createdAt: file.lastModified,
    };
  } catch (error) {
    console.error("Error in uploadFileToR2:", error);
    throw error;
  }
}
