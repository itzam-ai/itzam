interface ExtendedFile extends File {
  id: string;
}

export async function uploadImageToR2(file: ExtendedFile, userId: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);

  const imageUrl = await fetch("/api/bucket/upload", {
    method: "POST",
    body: formData,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(await response.text());
      }

      return (await response.text()).replaceAll('"', "");
    })
    .catch((error) => {
      throw error;
    });
  return { imageUrl, id: file.id };
}
