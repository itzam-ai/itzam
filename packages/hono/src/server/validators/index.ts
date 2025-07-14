import type { ValidationTargets } from "hono";
import { validator as zv } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import { z, ZodSchema } from "zod";
import {
  CreateThreadInputSchema,
  GetRunsByThreadParamsSchema,
  GetThreadsByWorkflowParamsSchema,
  GetThreadsByWorkflowQuerySchema,
  ObjectCompletionEventInputSchema,
  ObjectCompletionInputSchema,
  TextCompletionEventInputSchema,
  TextCompletionInputSchema,
} from "../../client/schemas";
import { ValidationAPIError } from "../../errors";

const messages = {
  INVALID_TYPE_ERROR: {
    error: "INVALID_TYPE_ERROR",
    message: "The provided value has an invalid type",
  },
  FIELD_REQUIRED: {
    error: "FIELD_REQUIRED",
    message: "This field is required",
  },
  VALIDATION_ERROR: {
    error: "VALIDATION_ERROR",
    message: "Validation failed for the provided input",
  },
};

export const zValidator = <
  T extends ZodSchema,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T
) =>
  zv(target, schema, (result) => {
    if (!result.success) {
      throw new HTTPException(400, {
        cause: result.error,
        message: JSON.stringify(
          result.error.issues.map((e) => {
            let errorCode: string;

            if (e.code === "invalid_type") {
              // For invalid type errors, check if we have custom error params
              const customParams = (e as any).params;
              errorCode =
                customParams?.invalid_type_error || "INVALID_TYPE_ERROR";
            } else if (e.code === "custom") {
              // For custom validation errors, params should be available
              const customParams = (e as any).params;
              if (customParams) {
                if (
                  e.message.includes("required") &&
                  customParams.required_error
                ) {
                  errorCode = customParams.required_error;
                } else if (customParams.invalid_type_error) {
                  errorCode = customParams.invalid_type_error;
                } else {
                  errorCode = "VALIDATION_ERROR";
                }
              } else {
                errorCode = "VALIDATION_ERROR";
              }
            } else if (e.code === "too_small" && (e as any).minimum === 1) {
              // Handle required string fields (min length 1)
              const customParams = (e as any).params;
              errorCode = customParams?.required_error || "FIELD_REQUIRED";
            } else {
              // Default fallback
              errorCode = "VALIDATION_ERROR";
            }
            const errorMessage =
              errorCode === e.message
                ? messages[errorCode as keyof typeof messages].message
                : e.message;

            const error: ValidationAPIError = {
              status: 400,
              error: errorCode,
              message: errorMessage,
              documentation: `https://docs.itz.am/api-reference/errors/${errorCode}`,
              path: e.path,
              received: (e as any).received,
              expected: (e as any).expected,
            };

            return error;
          }),
          null,
          2
        ),
      });
    }
  });

export const generateTextCompletionValidator = zValidator(
  "json",
  z.union([TextCompletionEventInputSchema, TextCompletionInputSchema])
);

export const generateObjectCompletionValidator = zValidator(
  "json",
  z.union([ObjectCompletionEventInputSchema, ObjectCompletionInputSchema])
);

export const streamTextCompletionValidator = zValidator(
  "json",
  TextCompletionInputSchema
);
export const streamObjectCompletionValidator = zValidator(
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
