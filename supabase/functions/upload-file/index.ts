// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import S3 from "aws-sdk/clients/s3.js";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Environment variables
const CLOUDFLARE_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID")!;
const CLOUDFLARE_ACCESS_KEY_ID = Deno.env.get("CLOUDFLARE_ACCESS_KEY_ID")!;
const CLOUDFLARE_SECRET_ACCESS_KEY = Deno.env.get(
  "CLOUDFLARE_SECRET_ACCESS_KEY"
)!;
const CLOUDFLARE_BUCKET = Deno.env.get("CLOUDFLARE_BUCKET")!;

// Initialize S3 client for Cloudflare R2 using aws-sdk v2
const s3 = new S3({
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: CLOUDFLARE_ACCESS_KEY_ID,
  secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
});

async function uploadFileToBucket(file: File, userId: string) {
  // Generate a safe filename
  const fileExtension = file.name.split(".").pop() || "bin";
  const baseName =
    file.name.split(".").slice(0, -1).join(".").replaceAll(" ", "-") || "file";

  const Key = `${userId}/${baseName}-${Date.now()}.${fileExtension}`;
  const Bucket = CLOUDFLARE_BUCKET;

  // Convert file to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const uploadParams = {
    Bucket,
    Key,
    Body: buffer,
    ContentType: file.type,
    ContentLength: file.size,
  };

  const result = await s3.upload(uploadParams).promise();

  return {
    ...result,
    imageUrl: "https://r2.itz.am/" + Key,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  } else if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Get the session or user object
  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseClient.auth.getUser(token);
  const user = data.user;

  if (error || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 401,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = (formData.get("userId") as string) || user.id;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }

    if (file.size > 1024 * 1024 * 10) {
      // 10MB
      return new Response(
        JSON.stringify({ error: "File size exceeds 10MB limit" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        }
      );
    }

    const data = await uploadFileToBucket(file, userId);

    return new Response(JSON.stringify({ imageUrl: data.imageUrl }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (e) {
    console.error("Upload error:", e);

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upload-file' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
