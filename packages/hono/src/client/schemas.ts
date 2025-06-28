import { z } from "zod";
import "zod-openapi/extend";

const AttachmentSchema = z.object({
  file: z.union(
    [
      z
        .string({
          invalid_type_error: "file must be a string",
          required_error: "file is required",
        })
        .base64({
          message: "file must be a base64 encoded string",
        })
        .openapi({
          type: "string",
          format: "byte",
          description: "Base64 encoded file",
        }),
      z
        .string()
        .url({
          message: "file must be a valid URL",
        })
        .openapi({
          type: "string",
          format: "uri",
          description: "Remote URI to the file",
        }),
    ],
    {
      required_error: "FIELD_REQUIRED",
      invalid_type_error: "INVALID_TYPE_ERROR",
    }
  ),
  mimeType: z
    .string({
      invalid_type_error: "INVALID_TYPE_ERROR",
    })
    .optional(),
});

const BaseInput = z.object({
  input: z
    .string({
      required_error: "FIELD_REQUIRED",
      invalid_type_error: "INVALID_TYPE_ERROR",
    })
    .min(1)
    .openapi({
      example: "Tell me about renewable energy",
      description: "The input text to generate a response for",
    }),
  attachments: z
    .array(AttachmentSchema, {
      invalid_type_error: "INVALID_TYPE_ERROR",
    })
    .optional()
    .openapi({
      example: [
        { file: "file_data", mimeType: "application/pdf" },
        { file: "image_data", mimeType: "image/png" },
        { file: "https://example.com/image.jpg" },
      ],
      description: "Optional attachments to include in the generation",
    }),
  contextSlugs: z
    .array(
      z.string({
        invalid_type_error: "INVALID_TYPE_ERROR",
      }),
      {
        invalid_type_error: "INVALID_TYPE_ERROR",
      }
    )
    .optional()
    .openapi({
      example: ["special-docs", "admin-files"],
      description: "Optional context slugs to add contexts to the run",
    }),
  workflowSlug: z
    .string({
      invalid_type_error: "INVALID_TYPE_ERROR",
    })
    .optional()
    .openapi({
      example: "my_great_workflow",
      description:
        "The slug of the Workflow to use for generation (required if threadId is not provided)",
    }),
  threadId: z
    .string({
      required_error: "FIELD_REQUIRED",
      invalid_type_error: "INVALID_TYPE_ERROR",
    })
    .optional()
    .openapi({
      example: "thread_1234567890",
      description:
        "Optional thread ID to associate this run with a conversation thread (required if workflowSlug is not provided)",
    }),
});

export const TextCompletionInputSchema = BaseInput.openapi({
  ref: "TextCompletionInput",
})
  .refine(
    (data) => (data.attachments && data.attachments.length > 0) || data.input,
    {
      message: "Attachments or input are required",
      path: ["attachments", "input"],
    }
  )
  .refine((data) => data.workflowSlug || data.threadId, {
    message: "Either workflowSlug or threadId is required",
    path: ["workflowSlug", "threadId"],
  });

export const ObjectCompletionInputSchema = BaseInput.extend({
  schema: z
    .custom<NonLiteralJson>(
      (data) => {
        if (!data) return false;

        // Must be an object with a type property
        if (typeof data !== "object" || !data["type"]) {
          return false;
        }

        const schemaType = data["type"];

        // Valid JSON Schema types for structured output
        switch (schemaType) {
          case "object":
          case "array":
            return true;
          case "string":
            // String schemas with enum are valid for structured output
            return Array.isArray(data["enum"]) && data["enum"].length > 0;
          default:
            return false;
        }
      },
      {
        message:
          "Must be a valid JSON Schema object with type 'object', 'array', or 'string' with enum values. See https://json-schema.org/ for specification.",
        params: {
          required_error: "FIELD_REQUIRED",
          invalid_type_error: "INVALID_TYPE_ERROR",
        },
      }
    )
    .openapi({
      example: {
        type: "object",
        title: "User Profile",
        description: "A user profile object",
        properties: {
          name: {
            type: "string",
            description: "The user's full name",
          },
          age: {
            type: "number",
            description: "The user's age",
          },
          interests: {
            type: "array",
            items: {
              type: "string",
            },
            description: "List of user interests",
          },
        },
        required: ["name", "age"],
      },
      description:
        "A valid JSON Schema object defining the structure of the expected response. Must have a 'type' property set to 'object', 'array', or 'string' (with enum). See https://json-schema.org/ for full specification.",
    }),
})
  .refine(
    (data) => (data.attachments && data.attachments.length > 0) || data.input,
    "Attachments or input are required"
  )
  .refine((data) => data.workflowSlug || data.threadId, {
    message: "Either workflowSlug or threadId is required",
    path: ["workflowSlug", "threadId"],
  })
  .openapi({ ref: "ObjectCompletionInput" });

export const StreamEventSchema = z
  .discriminatedUnion("type", [
    z
      .object({
        type: z.literal("object"),
        object: z.union([
          z
            .object({
              text: z.string(),
            })
            .openapi({ ref: "StreamEventObjectText" }),
          z
            .object({
              object: z.unknown(),
            })
            .openapi({
              ref: "StreamEventObjectUnknown",
              description: "Used for structured responses, based on the schema",
            }),
        ]),
      })
      .openapi({ ref: "StreamEventObject" }),
    z
      .object({
        type: z.literal("text-delta"),
        textDelta: z.string(),
      })
      .openapi({ ref: "StreamEventTextDelta" }),
    z
      .object({
        type: z.literal("error"),
        error: z.unknown(),
      })
      .openapi({ ref: "StreamEventError" }),
    z
      .object({
        type: z.literal("finish"),
        finishReason: z.enum([
          "stop",
          "length",
          "content-filter",
          "tool-calls",
          "error",
          "other",
          "unknown",
        ]),
        usage: z.object({
          promptTokens: z.number(),
          completionTokens: z.number(),
          totalTokens: z.number(),
        }),
      })
      .openapi({ ref: "StreamEventFinish" }),
  ])
  .openapi({ ref: "StreamEvent" });

export type StreamEvent = z.infer<typeof StreamEventSchema>;

export const GenerateTextResponseSchema = z
  .object({
    text: z.string().openapi({
      example: "Renewable energy is...",
      description: "The generated output text",
    }),
    metadata: z.object({
      runId: z.string().openapi({
        example: "run_1234567890",
        description: "The ID of the run created for this generation",
      }),
      cost: z.string().openapi({
        example: "0.001",
        description: "The cost of the run",
      }),
      model: z.object({
        name: z.string().openapi({
          example: "gpt-4o",
          description: "The name of the model used for this generation",
        }),
        tag: z.string().openapi({
          example: "openai:gpt-4o",
          description: "The tag of the model used for this generation",
        }),
      }),
      durationInMs: z.number().openapi({
        example: 1000,
        description: "The duration of the run in milliseconds",
      }),
      inputTokens: z.number().openapi({
        example: 1000,
        description: "The number of input tokens used for this generation",
      }),
      outputTokens: z.number().openapi({
        example: 1000,
        description: "The number of output tokens used for this generation",
      }),
    }),
  })
  .openapi({ ref: "GenerateTextResponse" });

export const GenerateObjectResponseSchema = z
  .object({
    object: z.record(z.any()).openapi({
      description: "The generated object based on the provided schema",
    }),
    metadata: z.object({
      runId: z.string().openapi({
        example: "run_1234567890",
        description: "The ID of the run created for this generation",
      }),
      cost: z.string().openapi({
        example: "0.001",
        description: "The cost of the run",
      }),
      model: z.object({
        name: z.string().openapi({
          example: "gpt-4o",
          description: "The name of the model used for this generation",
        }),
        tag: z.string().openapi({
          example: "openai:gpt-4o",
          description: "The tag of the model used for this generation",
        }),
      }),
      durationInMs: z.number().openapi({
        example: 1000,
        description: "The duration of the run in milliseconds",
      }),
      inputTokens: z.number().openapi({
        example: 1000,
        description: "The number of input tokens used for this generation",
      }),
      outputTokens: z.number().openapi({
        example: 1000,
        description: "The number of output tokens used for this generation",
      }),
    }),
  })
  .openapi({ ref: "GenerateObjectResponse" });

export const GetModelsResponseSchema = z
  .object({
    models: z.array(
      z.object({
        name: z.string().openapi({
          example: "gpt-4o",
          description: "The name of the model",
        }),
        tag: z.string().openapi({
          example: "gpt-4o",
          description: "The tag of the model",
        }),
        deprecated: z.boolean().openapi({
          example: false,
          description: "Whether the model is deprecated",
        }),
        hasVision: z.boolean().openapi({
          example: false,
          description: "Whether the model has vision capability",
        }),
        hasReasoningCapability: z.boolean().openapi({
          example: false,
          description: "Whether the model has reasoning capability",
        }),
        isOpenSource: z.boolean().openapi({
          example: false,
          description: "Whether the model is open source",
        }),
        contextWindowSize: z.number().openapi({
          example: 100000,
          description: "The context window size of the model",
        }),
        inputPerMillionTokenCost: z.number().openapi({
          example: 0.00015,
          description: "The input cost per million tokens of the model",
        }),
        outputPerMillionTokenCost: z.number().openapi({
          example: 0.0006,
          description: "The output cost per million tokens of the model",
        }),
        provider: z.object({
          name: z.string().openapi({
            example: "OpenAI",
            description: "The name of the provider",
          }),
        }),
      })
    ),
  })
  .openapi({ ref: "GetModelsResponse" });

export const StreamTextEventSchema = z
  .discriminatedUnion("type", [
    z
      .object({
        type: z.literal("object"),
        object: z.object({
          output: z.string(),
        }),
      })
      .openapi({ ref: "StreamTextEventObject" }),
    z
      .object({
        type: z.literal("text-delta"),
        textDelta: z.string(),
      })
      .openapi({ ref: "StreamTextEventTextDelta" }),
    z
      .object({
        type: z.literal("error"),
        error: z.unknown(),
      })
      .openapi({ ref: "StreamTextEventError" }),
    z
      .object({
        type: z.literal("finish"),
        finishReason: z.enum([
          "stop",
          "length",
          "content-filter",
          "tool-calls",
          "error",
          "other",
          "unknown",
        ]),
        usage: z.object({
          promptTokens: z.number(),
          completionTokens: z.number(),
          totalTokens: z.number(),
        }),
      })
      .openapi({ ref: "StreamTextEventFinish" }),
  ])
  .openapi({ ref: "StreamTextEvent" });

export const GetRunByIdResponseSchema = z
  .object({
    id: z.string().openapi({
      example: "run_1234567890",
      description: "The ID of the run",
    }),
    origin: z.string().openapi({
      example: "SDK",
      description: "The origin of the run",
    }),
    status: z.string().openapi({
      example: "COMPLETED",
      description: "The status of the run",
    }),
    input: z.string().openapi({
      example: "Who are you?",
      description: "The input of the run",
    }),
    output: z.string().openapi({
      example: "I'm a helpful assistant",
      description: "The output of the run",
    }),
    prompt: z.string().openapi({
      example: "Be friendly and helpful",
      description: "The prompt of the run",
    }),
    inputTokens: z.number().openapi({
      example: 100,
      description: "The number of input tokens of the run",
    }),
    outputTokens: z.number().openapi({
      example: 100,
      description: "The number of output tokens of the run",
    }),
    cost: z.string().openapi({
      example: "0.001",
      description: "The cost of the run",
    }),
    durationInMs: z.number().openapi({
      example: 100,
      description: "The duration of the run in milliseconds",
    }),
    threadId: z.string().nullable().openapi({
      example: "thread_1234567890",
      description: "The thread ID of the run",
    }),
    model: z.object({
      name: z.string().openapi({
        example: "GPT-4o",
        description: "The name of the model",
      }),
      tag: z.string().openapi({
        example: "openai:gpt-4o",
        description: "The tag of the model",
      }),
    }),
    attachments: z
      .array(
        z.object({
          url: z.string().openapi({
            example: "https://example.com/image.jpg",
            description: "The URL of the attachment",
          }),
          mimeType: z.string().openapi({
            example: "image/jpeg",
            description: "The MIME type of the attachment",
          }),
          id: z.string().openapi({
            example: "attachment_1234567890",
            description: "The ID of the attachment",
          }),
        })
      )
      .nullable(),
    knowledge: z
      .array(
        z.object({
          id: z.string().openapi({
            example: "1353151353531",
            description: "The ID of the knowledge",
          }),
          title: z.string().nullable().openapi({
            example: "My Resource",
            description: "The title of the knowledge",
          }),
          url: z.string().openapi({
            example: "https://example.com/resource.pdf",
            description: "The URL of the knowledge",
          }),
          type: z.string().openapi({
            example: "file",
            description: "The type of the knowledge",
          }),
        })
      )
      .nullable(),
    workflowId: z.string().openapi({
      example: "workflow_1234567890",
      description: "The ID of the workflow",
    }),
    createdAt: z.string().openapi({
      example: "2021-01-01T00:00:00.000Z",
      description: "The creation date of the run",
    }),
  })
  .openapi({ ref: "GetRunByIdResponse" });

export const GetRunByIdParamsSchema = z.object({
  id: z
    .string({
      required_error: "FIELD_REQUIRED",
      invalid_type_error: "INVALID_TYPE_ERROR",
    })
    .openapi({
      example: "run_1234567890",
      description: "The ID of the run to retrieve",
    }),
});

// -------- THREADS --------
export const CreateThreadInputSchema = z
  .object({
    name: z
      .string({
        invalid_type_error: "INVALID_TYPE_ERROR",
      })
      .optional()
      .openapi({
        example: "My Thread",
        description:
          "The name of the thread (optional, will auto-generate if not provided)",
      }),
    lookupKeys: z
      .array(
        z.string({
          invalid_type_error: "INVALID_TYPE_ERROR",
        }),
        {
          invalid_type_error: "INVALID_TYPE_ERROR",
        }
      )
      .optional()
      .openapi({
        example: ["user-123", "platform-web-app"],
        description: "Optional lookup keys for finding the thread later",
      }),
    contextSlugs: z
      .array(
        z.string({
          invalid_type_error: "INVALID_TYPE_ERROR",
        }),
        {
          invalid_type_error: "INVALID_TYPE_ERROR",
        }
      )
      .optional()
      .openapi({
        example: ["special-docs", "admin-files"],
        description:
          "Optional context slugs to append the context to the thread",
      }),
    workflowSlug: z
      .string({
        required_error: "FIELD_REQUIRED",
        invalid_type_error: "INVALID_TYPE_ERROR",
      })
      .min(1)
      .openapi({
        example: "my_great_workflow",
        description: "The slug of the workflow this thread belongs to",
      }),
  })
  .openapi({ ref: "CreateThreadInput" });

export const CreateThreadResponseSchema = z
  .object({
    id: z.string().openapi({
      example: "thread_1234567890",
      description: "The ID of the created thread",
    }),
    name: z.string().openapi({
      example: "My Thread",
      description: "The name of the thread",
    }),
    lookupKeys: z
      .array(z.string())
      .nullable()
      .openapi({
        example: ["user-123", "platform-web-app"],
        description: "The lookup keys of the thread",
      }),
    contextSlugs: z
      .array(z.string())
      .nullable()
      .openapi({
        example: ["special-docs", "admin-files"],
        description: "The context slugs of the thread",
      }),
    createdAt: z.string().openapi({
      example: "2021-01-01T00:00:00.000Z",
      description: "The creation date of the thread",
    }),
    updatedAt: z.string().openapi({
      example: "2021-01-01T00:00:00.000Z",
      description: "The last update date of the thread",
    }),
  })
  .openapi({ ref: "CreateThreadResponse" });

export const GetThreadResponseSchema = z
  .object({
    id: z.string().openapi({
      example: "thread_1234567890",
      description: "The ID of the thread",
    }),
    name: z.string().openapi({
      example: "My Thread",
      description: "The name of the thread",
    }),
    lookupKeys: z
      .array(z.string())
      .nullable()
      .openapi({
        example: ["user-123-session"],
        description: "The lookup keys of the thread",
      }),
    contextSlugs: z
      .array(z.string())
      .nullable()
      .openapi({
        example: ["special-docs", "admin-files"],
        description: "The context slugs of the thread",
      }),
    createdAt: z.string().openapi({
      example: "2021-01-01T00:00:00.000Z",
      description: "The creation date of the thread",
    }),
    updatedAt: z.string().openapi({
      example: "2021-01-01T00:00:00.000Z",
      description: "The last update date of the thread",
    }),
  })
  .openapi({ ref: "GetThreadResponse" });

export const GetThreadsByWorkflowParamsSchema = z.object({
  workflowSlug: z
    .string({
      required_error: "FIELD_REQUIRED",
      invalid_type_error: "INVALID_TYPE_ERROR",
    })
    .openapi({
      example: "my_great_workflow",
      description: "The slug of the workflow to get threads for",
    }),
});

export const GetThreadsByWorkflowQuerySchema = z.object({
  lookupKeys: z
    .union(
      [
        z
          .string({
            invalid_type_error: "INVALID_TYPE_ERROR",
          })
          .transform((val) => [val]),
        z.array(
          z.string({
            invalid_type_error: "INVALID_TYPE_ERROR",
          }),
          {
            invalid_type_error: "INVALID_TYPE_ERROR",
          }
        ),
      ],
      {
        invalid_type_error: "INVALID_TYPE_ERROR",
      }
    )
    .optional()
    .openapi({
      example: ["user-123", "platform-web-app"],
      description: "Optional lookup keys to filter threads",
    }),
});

export const GetThreadsByWorkflowResponseSchema = z
  .object({
    threads: z.array(GetThreadResponseSchema).openapi({
      description: "Array of threads for the workflow",
    }),
  })
  .openapi({ ref: "GetThreadsByWorkflowResponse" });

export const GetRunsByThreadParamsSchema = z.object({
  threadId: z
    .string({
      required_error: "FIELD_REQUIRED",
      invalid_type_error: "INVALID_TYPE_ERROR",
    })
    .openapi({
      example: "thread_1234567890",
      description: "The ID of the thread to get runs for",
    }),
});

export const GetRunsByThreadResponseSchema = z
  .object({
    runs: z.array(GetRunByIdResponseSchema).openapi({
      description: "Array of runs in the thread",
    }),
  })
  .openapi({ ref: "GetRunsByThreadResponse" });

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
export type NonLiteralJson = Exclude<Json, Literal>;

const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);
