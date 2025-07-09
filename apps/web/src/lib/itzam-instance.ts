import { createClient } from "@itzam/server/db/supabase/server";
import Itzam from "itzam";
import { cache } from "react";

/**
 * Get the authenticated Itzam SDK instance using the current user's auth token.
 * This function is cached to ensure we reuse the same instance per request.
 */
export const getItzamInstance = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  const basePath = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return new Itzam(session.access_token, {
    basePath,
  });
});
