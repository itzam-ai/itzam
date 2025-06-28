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
