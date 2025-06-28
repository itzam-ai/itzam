import { getAvailableModelsWithCost } from "@itzam/server/db/model/actions";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { GetModelsResponseSchema } from "../../client/schemas";
import { createErrorResponse } from "../../utils";
import { createOpenApiErrors } from "../docs";

export const modelsRoute = new Hono().get(
  "/",
  describeRoute({
    summary: "Get models",
    description: "Retrieve all models available on Itzam",
    operationId: "getModels",
    responses: createOpenApiErrors({
      content: {
        "application/json": {
          schema: resolver(GetModelsResponseSchema),
        },
      },
      description: "Successfully retrieved models",
    }),
  }),
  async (c) => {
    try {
      const models = await getAvailableModelsWithCost();

      const modelsList = models.map((model) => ({
        name: model.name,
        tag: model.tag,
        deprecated: model.deprecated,
        hasVision: model.hasVision,
        hasReasoningCapability: model.hasReasoningCapability,
        isOpenSource: model.isOpenSource,
        contextWindowSize: model.contextWindowSize,
        inputPerMillionTokenCost:
          model.inputPerMillionTokenCost?.toString() ?? null,
        outputPerMillionTokenCost:
          model.outputPerMillionTokenCost?.toString() ?? null,
        provider: {
          name: model.provider?.name ?? "",
        },
      }));

      return c.json({
        models: modelsList,
      });
    } catch (error) {
      return c.json(createErrorResponse(error), 500);
    }
  }
);
