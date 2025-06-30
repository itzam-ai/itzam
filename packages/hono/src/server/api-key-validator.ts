import { createMiddleware } from "hono/factory";
import { validateRequest } from "../utils";
import { createErrorResponse } from "../errors";

// Define the type for context variables set by this middleware
type ApiKeyValidatorEnv = {
  Variables: {
    userId: string;
  };
};

/**
 * Hono middleware to validate the API key provided in the 'Api-Key' header.
 * It checks for the presence of the key, validates it against the database,
 * checks for an active subscription, and sets the validated organization
 * details in the context (`c.var.organization`) for downstream handlers.
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

      // Set the validated organization in the context for downstream handlers
      // Organization is guaranteed to be non-null on success based on validateRequest types
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
