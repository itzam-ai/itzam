import { createMiddleware } from "hono/factory";
import { validateRequest } from "../utils";

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
    const apiKey = c.req.header("Api-Key");

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      // Return a JSON response consistent with other potential errors
      return c.json({ error: "API key is required" }, 401);
    }

    const validationResult = await validateRequest(apiKey);

    if (validationResult.error) {
      // Status is guaranteed to be non-null if error is non-null based on validateRequest types
      return c.json(
        { error: validationResult.error },
        validationResult.status!
      );
    }

    // Set the validated organization in the context for downstream handlers
    // Organization is guaranteed to be non-null on success based on validateRequest types
    c.set("userId", validationResult.userId!);

    // Proceed to the next middleware or handler
    await next();
  }
);
