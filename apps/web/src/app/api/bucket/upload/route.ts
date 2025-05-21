import { getUser } from "@itzam/server/db/auth/actions";
import { uploadFileToBucket } from "@itzam/server/r2/server";

export async function POST(req: Request) {
  const { data: user } = await getUser();

  // Check if user is authenticated
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) {
      return new Response("No file uploaded! :/", { status: 400 });
    }

    if (file.size > 1024 * 1024 * 10) {
      // 10MB
      return new Response("We only accept files up to 10MB", {
        status: 400,
      });
    }

    const data = await uploadFileToBucket(file, userId);

    return new Response(JSON.stringify(data.imageUrl), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.error("API route error:", e);

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
