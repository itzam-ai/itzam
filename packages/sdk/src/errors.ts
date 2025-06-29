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
  status: 400;
  expected: string;
  received: string;
  path: (string | number)[];
}

export interface ServerAPIError extends BaseAPIError {
  status: 500;
}

export class ItzamError extends Error {
  public readonly status: number;
  public readonly type: string;
  public readonly timestamp: Date;
  public readonly documentation: string;

  constructor(apiError: BaseAPIError) {
    super(apiError.message);
    this.status = apiError.status;
    this.type = this.constructor.name;
    this.timestamp = new Date();
    this.documentation = apiError.documentation;
  }
}

export class ItzamAuthenticationError extends ItzamError {
  constructor(apiError: UnauthorizedAPIError) {
    super(apiError);
  }
}

export class ItzamValidationError extends ItzamError {
  public readonly expected: string;
  public readonly received: string;
  public readonly path: (string | number)[];

  constructor(apiError: ValidationAPIError) {
    super(apiError);
    this.expected = apiError.expected;
    this.received = apiError.received;
    this.path = apiError.path;
  }
}

export class ItzamNotFoundError extends ItzamError {
  public readonly possibleValues: string[];

  constructor(apiError: NotFoundAPIError) {
    super(apiError);
    this.possibleValues = apiError.possibleValues;
  }
}

export class ItzamServerError extends ItzamError {
  constructor(apiError: ServerAPIError) {
    super(apiError);
  }
}

export function createItzamError(error: any): ItzamError {
  if (error instanceof ItzamError) {
    return error;
  } else if (error?.status) {
    try {
      const body = error;

      switch (error.status) {
        case 400:
          return new ItzamValidationError(body as ValidationAPIError);
        case 401:
          return new ItzamAuthenticationError(body as UnauthorizedAPIError);
        case 404:
          return new ItzamNotFoundError(body as NotFoundAPIError);
        case 500:
          return new ItzamServerError(body as ServerAPIError);
        default:
          return new ItzamError({
            error: body.error || "Unknown error",
            message: body.message || "An unknown error occurred",
            documentation: body.documentation || "",
            status: error.status,
          });
      }
    } catch (parseError) {
      // If we can't parse the response body, create a generic error
      return new ItzamError({
        error: "Parse Error",
        message: error.statusText || "Failed to parse error response",
        documentation: "",
        status: error.status || 500,
      });
    }
  }

  // If it's a JavaScript Error object
  if (error instanceof Error) {
    return new ItzamError({
      error: error.name || "Error",
      message: error.message,
      documentation: "",
      status: 500,
    });
  }

  // For any other type of error
  return new ItzamError({
    error: "Unknown Error",
    message: typeof error === "string" ? error : "An unknown error occurred",
    documentation: "",
    status: 500,
  });
}
