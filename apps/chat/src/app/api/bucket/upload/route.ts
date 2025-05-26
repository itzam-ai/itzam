import { getUser } from "@itzam/server/db/auth/actions";
import { createClient } from "@itzam/server/db/supabase/server";

export async function POST(req: Request) {
  const { data: user } = await getUser();

  // Check if user is authenticated
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return new Response("No file uploaded! :/", { status: 400 });
    }

    if (file.size > 1024 * 1024 * 10) {
      // 10MB
      return new Response("What a big file! We only accept files up to 10MB", {
        status: 400,
      });
    }

    // Call the edge function
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new Response("No session found", { status: 401 });
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("userId", formData.get("userId") as string);

    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/upload-file`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: uploadFormData,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    const result = await response.json();

    return new Response(JSON.stringify(result.imageUrl), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.error(e);

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
