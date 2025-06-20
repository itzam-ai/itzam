import { handle } from "hono/vercel";

import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import "zod-openapi/extend";
import { createErrorResponse } from "../utils";
import { generateRoute } from "./routes/generate";
import { modelsRoute } from "./routes/models";
import { runsRoute } from "./routes/runs";
import { streamRoute } from "./routes/stream";
import { threadsRoute } from "./routes/threads";

const app = new Hono()
  .basePath("/api/v1")
  .route("/generate", generateRoute)
  .route("/stream", streamRoute)
  .route("/runs", runsRoute)
  .route("/models", modelsRoute)
  .route("/threads", threadsRoute)
  .onError((err, c) => {
    // Handle HTTPException (including validation errors)
    if (err instanceof HTTPException) {
      const validationError = new Error(`Validation error: ${err.message}`);
      // Try to get userId if it exists, otherwise undefined
      let userId: string | undefined;
      try {
        userId = c.get("userId" as never) as string;
      } catch {
        userId = undefined;
      }

      const errorResponse = createErrorResponse(validationError, {
        endpoint: c.req.path,
        userId,
      });

      // Return the original HTTPException response but log to Discord
      const response = err.getResponse();
      return response;
    }

    // Handle all other errors
    // Try to get userId if it exists, otherwise undefined
    let userId: string | undefined;
    try {
      userId = c.get("userId" as never) as string;
    } catch {
      userId = undefined;
    }

    const errorResponse = createErrorResponse(err, {
      endpoint: c.req.path,
      userId,
    });

    return c.json(errorResponse, 500);
  });

app.get(
  "/doc",
  openAPISpecs(app, {
    defaultOptions: {
      ALL: {
        security: [{ ApiKey: [] }],
      },
    },
    documentation: {
      servers: [
        {
          url: "https://itz.am",
          description: "Itzam Live API",
        },
      ],
      info: {
        version: "1.0.0",
        title: "Itzam API",
      },
      components: {
        securitySchemes: {
          ApiKey: {
            type: "apiKey",
            in: "header",
            name: "Api-Key",
            description: "The API key to use for authentication",
          },
        },
      },
      security: [{ ApiKey: [] }],
    },
  })
);

app.use(logger());

export const vercelHonoApp = handle(app);
export type AppType = typeof app;
