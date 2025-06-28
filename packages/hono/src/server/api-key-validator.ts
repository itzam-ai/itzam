import { createMiddleware } from "hono/factory";
import { validateRequest, createErrorResponse } from "../utils";
import { UnauthorizedAPIError } from "../errors";

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
        const error: UnauthorizedAPIError = {
          error: "UNAUTHORIZED",
          message: "API key is required",
          documentation: "https://docs.itz.am/errors/UNAUTHORIZED",
          status: 401,
        };

        return c.json(error, 401);
      }

      const { userId, error } = await validateRequest(apiKey);

      if (!userId || error) {
        const apiKeyError: UnauthorizedAPIError = {
          error: "UNAUTHORIZED",
          message: error || "API key is required",
          documentation: "https://docs.itz.am/errors/UNAUTHORIZED",
          status: 401,
        };

        return c.json(apiKeyError, 401);
      }

      // Set the validated organization in the context for downstream handlers
      // Organization is guaranteed to be non-null on success based on validateRequest types
      c.set("userId", userId);

      // Proceed to the next middleware or handler
      await next();
    } catch (error) {
      // Handle any unexpected errors in the middleware
      const errorResponse = createErrorResponse(error, {
        endpoint: c.req.path,
      });
      return c.json(errorResponse, 500);
    }
  }
);
