// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { db } from "@itzam/server/db/index";
import { resources } from "@itzam/server/db/schema";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js";

console.log("Hello from Functions!");

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    throw new Error(error.message);
  }

  type ResourceInput = {
    url: string;
    type: "FILE" | "LINK";
    mimeType: string;
    fileName: string;
    fileSize: number;
    id?: string;
  };

  const body = await req.json();
  const { resourcesInput, knowledgeId, workflowId } = body;

  const resourcesCreated = await db
    .insert(resources)
    .values(
      resourcesInput.map((resource) => ({
        ...resource,
        id: resource.id ?? v7(),
        knowledgeId,
      }))
    )
    .returning();

  resourcesCreated.forEach((resource) => {
    void createEmbeddings(resource, workflowId);
  });

  return resourcesCreated;
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-knowledge-resource' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
