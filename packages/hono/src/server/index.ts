import { handle } from "hono/vercel";

import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import { logger } from "hono/logger";
import "zod-openapi/extend";
import { generateRoute } from "./routes/generate";
import { modelsRoute } from "./routes/models";
import { runsRoute } from "./routes/runs";
import { streamRoute } from "./routes/stream";

const app = new Hono()
  .basePath("/api/v1")
  .route("/generate", generateRoute)
  .route("/stream", streamRoute)
  .route("/runs", runsRoute)
  .route("/models", modelsRoute);

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
