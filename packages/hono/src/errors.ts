import { notifyDiscordError } from "@itzam/utils/error-notifier";

export type BaseAPIError = {
  error: string;
  message: string;
  documentation: string;
  status: 400 | 401 | 404 | 500;
};

export interface NotFoundAPIError extends BaseAPIError {
  status: 404;
  possibleValues: string[];
}

export interface UnauthorizedAPIError extends BaseAPIError {
  status: 401;
}

export interface ValidationAPIError extends BaseAPIError {
  expected: string;
  received: string;
  path: (string | number)[];
}

export interface ServerAPIError extends BaseAPIError {
  status: 500;
  providerError?: any;
}

export type StatusCode = 200 | 400 | 401 | 404 | 500;

// Common error response function
export const createErrorResponse = (
  status: StatusCode,
  message: string,
  options?: {
    path?: (string | number)[];
    received?: string;
    expected?: string;
    possibleValues?: string[];
    context?: { userId?: string; workflowSlug?: string; endpoint?: string };
    providerError?: any;
  }
) => {
  console.error("Error in endpoint:", message);

  // Send Discord notification for production errors
  notifyDiscordError(new Error(message), status, options?.context).catch(
    console.error
  );

  switch (status) {
    case 400: {
      const error: ValidationAPIError = {
        status: 400,
        error: "VALIDATION_ERROR",
        message: message,
        documentation: `https://docs.itz.am/api-reference/errors/VALIDATION_ERROR`,
        path: options?.path || [],
        received: options?.received || "",
        expected: options?.expected || "",
      };

      return error;
    }
    case 401: {
      const error: UnauthorizedAPIError = {
        status: 401,
        error: "UNAUTHORIZED",
        message: message,
        documentation: `https://docs.itz.am/api-reference/errors/UNAUTHORIZED`,
      };
      return error;
    }
    case 404: {
      const error: NotFoundAPIError = {
        status: 404,
        error: "NOT_FOUND_ERROR",
        message: message,
        documentation: `https://docs.itz.am/api-reference/errors/NOT_FOUND_ERROR`,
        possibleValues: options?.possibleValues || [],
      };
      return error;
    }
    case 500: {
      const error: ServerAPIError = {
        status: 500,
        error: "INTERNAL_SERVER_ERROR",
        message: message,
        documentation: `https://docs.itz.am/api-reference/errors/INTERNAL_SERVER_ERROR`,
        providerError: options?.providerError,
      };
      return error;
    }
    default: {
      const error: ServerAPIError = {
        status: 500,
        error: "INTERNAL_SERVER_ERROR",
        message: message,
        documentation: `https://docs.itz.am/api-reference/errors/INTERNAL_SERVER_ERROR`,
        providerError: options?.providerError,
      };
      return error;
    }
  }
};
