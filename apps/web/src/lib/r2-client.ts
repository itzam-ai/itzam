interface ExtendedFile extends File {
  id: string;
}

export async function uploadFileToR2(file: ExtendedFile, userId: string) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    const response = await fetch("/api/bucket/upload", {
      method: "POST",
      body: formData,
    }).catch((error) => {
      console.error("Fetch request failed:", error);
      throw new Error(`Network error: ${error.message}`);
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Upload failed with status:",
        response.status,
        "Error:",
        errorText
      );
      throw new Error(`${errorText}`);
    }

    const url = (await response.text()).replaceAll('"', "");
    return { url, id: file.id };
  } catch (error) {
    console.error("Error in uploadFileToR2:", error);
    throw error;
  }
}
