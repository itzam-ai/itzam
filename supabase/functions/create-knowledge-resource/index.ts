import { drizzle } from "drizzle-orm/postgres-js";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "postgres";
import { countries } from "../_shared/database.types";

const connectionString = Deno.env.get("SUPABASE_DB_URL")!;

Deno.serve(async (_req) => {
  // Disable prefetch as it is not supported for "Transaction" pool mode
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);
  const allCountries = await db.select().from(countries);

  return Response.json(allCountries);
});
