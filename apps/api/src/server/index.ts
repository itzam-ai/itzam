import { otel } from "@hono/otel";
import { NodeSDK } from "@opentelemetry/sdk-node";

import { handle } from "hono/vercel";

import { serve } from "@hono/node-server";
import { env } from "@itzam/utils/env";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
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
	}),
);

const sdk = new NodeSDK({
	traceExporter: new OTLPTraceExporter({
		// optional - default url is http://localhost:4318/v1/traces
		url: env.OTEL_EXPORTER_OTLP_ENDPOINT,
		// optional - collection of custom headers to be sent with each request, empty by default
		headers: {
			Authorization: `Bearer ${env.HYPERDX_API_KEY}`,
		},
	}),
	metricReader: new PeriodicExportingMetricReader({
		exporter: new OTLPMetricExporter({
			url: env.OTEL_EXPORTER_OTLP_ENDPOINT, // url is optional and can be omitted - default is http://localhost:4318/v1/metrics
			headers: {
				Authorization: `Bearer ${env.HYPERDX_API_KEY}`,
			}, // an optional object containing custom headers to be sent with each request
		}),
	}),

	instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

app.use(logger());
app.use("*", otel());

export const vercelHonoApp = handle(app);
export type AppType = typeof app;

serve(
	{
		fetch: app.fetch,
		port: 4000,
	},
	(info) => {
		console.log(`Listening on http://localhost:${info.port}`); // Listening on http://localhost:3000
	},
);

export default app;
