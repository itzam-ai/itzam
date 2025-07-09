import { createMiddleware } from "hono/factory";
import { createErrorResponse } from "../errors";
import { validateRequest } from "../utils";

// Define the type for context variables set by this middleware
type ApiKeyValidatorEnv = {
  Variables: {
    userId: string;
  };
};

/**
 * Hono middleware to validate authentication via the 'Api-Key' header.
 * Supports two authentication methods:
 * 1. API keys (starting with 'itzam_') - validated against the database
 * 2. Auth tokens - validated via Supabase auth
 *
 * Sets the validated userId in the context (`c.var.userId`) for downstream handlers.
 *
 * @see https://hono.dev/docs/guides/middleware
 */
export const apiKeyMiddleware = createMiddleware<ApiKeyValidatorEnv>(
  async (c, next) => {
    try {
      const apiKey = c.req.header("Api-Key");

      if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
        return c.json(createErrorResponse(401, "API key is required"), 401);
      }

      const { userId, error } = await validateRequest(apiKey);

      if (!userId || error) {
        return c.json(
          createErrorResponse(401, error || "API key is required"),
          401
        );
      }

      // Set the validated userId in the context for downstream handlers
      c.set("userId", userId);

      // Proceed to the next middleware or handler
      await next();
    } catch (error) {
      // Handle any unexpected errors in the middleware
      const errorResponse = createErrorResponse(
        500,
        error instanceof Error ? error.message : "Unknown error",
        {
          context: {
            userId: c.get("userId"),
          },
        }
      );

      return c.json(errorResponse, 500);
    }
  }
);
