import { resolver } from "hono-openapi/zod";

type SuccessfulResponseContent =
  | {
      "application/json": {
        schema: ReturnType<typeof resolver>;
      };
    }
  | {
      "text/event-stream": {
        schema: ReturnType<typeof resolver>;
      };
    };

export function createOpenApiErrors(successfulResponse: {
  content: SuccessfulResponseContent;
  description: string;
}) {
  return {
    200: successfulResponse,
    400: {
      description: "Bad request - invalid input",
    },
    401: {
      description: "Unauthorized - invalid API key",
    },
    403: {
      description:
        "Forbidden - organization does not have an active subscription",
    },
    404: {
      description: "Not found - workflow not found",
    },
    500: {
      description: "Server error during generation",
    },
  };
}
