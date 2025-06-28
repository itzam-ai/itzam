import type { ValidationTargets } from "hono";
import { validator as zv } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import { ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  CreateThreadInputSchema,
  GetRunsByThreadParamsSchema,
  GetThreadsByWorkflowParamsSchema,
  GetThreadsByWorkflowQuerySchema,
  ObjectCompletionInputSchema,
  TextCompletionInputSchema,
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
    console.log("result", result);
    console.log("schema", schema);

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

            console.log("expected", expected);
            console.log("inputPath", inputPath);
            console.log("inputValue", inputValue);

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
