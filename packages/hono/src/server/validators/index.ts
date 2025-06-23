import type { ValidationTargets } from "hono";
import { validator as zv } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import { z, ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  CreateContextInputSchema,
  CreateThreadInputSchema,
  GetRunsByThreadParamsSchema,
  GetThreadsByWorkflowParamsSchema,
  GetThreadsByWorkflowQuerySchema,
  ObjectCompletionInputSchema,
  TextCompletionInputSchema,
  UpdateContextInputSchema,
} from "../../client/schemas";

const messages = {
  FILE_PROPERTY_REQUIRED: {
    error: "FILE_PROPERTY_REQUIRED",
    message: "The file property is required in the attachments array",
    documentation: "https://docs.itz.am/errors/FILE_PROPERTY_REQUIRED",
  },
};

function getDescendantProp(obj: object, desc: string) {
  const arr = desc.split(".");
  while (arr.length) {
    obj = obj[arr.shift() as keyof typeof obj];
  }
  return obj;
}

export const zValidator = <
  T extends ZodSchema,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T
) =>
  zv(target, schema, (result, c) => {
    console.log(result);
    console.log(schema);

    if (!result.success) {
      throw new HTTPException(400, {
        cause: result.error,
        message: JSON.stringify(
          result.error.issues.map((e) => {
            const inputPath = e.path.join(".");
            const inputValue = getDescendantProp(
              result.data,
              e.path.slice(0, -1).join(".")
            );

            const expected = zodToJsonSchema(schema);

            console.log(expected);

            return {
              ...messages["FILE_PROPERTY_REQUIRED"],
              path: inputPath,
              received: inputValue,
              expected: {
                file: "string:base64",
                type: "file",
              },
            };
          }),
          null,
          2
        ),
      });
    }
  });

export const textCompletionValidator = zValidator(
  "json",
  TextCompletionInputSchema
);

export const objectCompletionValidator = zValidator(
  "json",
  ObjectCompletionInputSchema
);

export const createThreadValidator = zValidator(
  "json",
  CreateThreadInputSchema
);

export const getThreadsByWorkflowParamsValidator = zValidator(
  "param",
  GetThreadsByWorkflowParamsSchema
);

export const getThreadsByWorkflowQueryValidator = zValidator(
  "query",
  GetThreadsByWorkflowQuerySchema
);

export const getRunsByThreadParamsValidator = zValidator(
  "param",
  GetRunsByThreadParamsSchema
);

export const createContextValidator = zValidator(
  "json",
  CreateContextInputSchema
);

export const updateContextValidator = zValidator(
  "json",
  UpdateContextInputSchema
);

export const deleteContextValidator = zValidator(
  "param",
  z.object({
    contextId: z.string().openapi({
      description: "The ID of the context to delete",
      example: "context_1234567890",
    }),
  })
);
