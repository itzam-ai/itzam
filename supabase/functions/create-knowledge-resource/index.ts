import { drizzle } from "drizzle-orm/postgres-js";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { v7 } from "npm:uuid@^11.1.0";
import { z } from "npm:zod@^3.24.2";
import postgres from "postgres";
import { corsHeaders } from "../_shared/cors.ts";
import { resources } from "../_shared/schema.ts";
const connectionString = Deno.env.get("SUPABASE_DB_URL")!;

const ResourceSchema = z.object({
  resources: z.array(
    z.object({
      url: z.string(),
      type: z.enum(["FILE", "LINK"]),
      mimeType: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
      id: z.string().optional(),
    })
  ),
  knowledgeId: z.string(),
  workflowId: z.string(),
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    });
  }

  const body = await req.json();
  const parsed = ResourceSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }

  // Disable prefetch as it is not supported for "Transaction" pool mode
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  const resourcesCreated = await db
    .insert(resources)
    .values(
      parsed.data.resources.map((resource) => ({
        ...resource,
        id: resource.id ?? v7(),
        knowledgeId: parsed.data.knowledgeId,
      }))
    )
    .returning();

  resourcesCreated.forEach((resource) => {
    void createEmbeddings(resource, parsed.data.workflowId);
  });

  resourcesCreated.forEach((resource) => {
    EdgeRuntime.waitUntil(createEmbeddings(resource, parsed.data.workflowId));
  });

  return new Response(JSON.stringify({ resources: resourcesCreated }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
