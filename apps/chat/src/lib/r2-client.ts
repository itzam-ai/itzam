import { createClient } from "@itzam/supabase/client";

interface ExtendedFile extends File {
  id: string;
}

const supabase = createClient();

export async function uploadImageToR2(file: ExtendedFile, userId: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);

  const { data, error } = await supabase.functions.invoke("upload-file", {
    body: formData,
  });

  if (error) {
    throw new Error(error.message || "Failed to upload file");
  }

  if (!data?.imageUrl) {
    throw new Error("No URL returned from upload");
  }

  return {
    imageUrl: data.imageUrl,
    id: file.id,
  };
}
