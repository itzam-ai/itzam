export type ItzamErrorCode = 400 | 401 | 404 | 500;

export class ItzamError extends Error {
  public readonly code: ItzamErrorCode;
  public readonly type: string;
  public readonly timestamp: Date;

  constructor(message: string, code: ItzamErrorCode) {
    super(message);
    this.name = 'ItzamError';
    this.code = code;
    this.type = this.constructor.name;
    this.timestamp = new Date();
  }
}

export class ItzamAuthenticationError extends ItzamError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ItzamValidationError extends ItzamError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ItzamNotFoundError extends ItzamError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ItzamServerError extends ItzamError {
  constructor(message: string) {
    super(message, 500);
  }
}

export function createItzamError(error: any): ItzamError {
  if (error?.response?.status) {
    const message = error.response.data?.error || error.message;

    switch (error.response.status) {
      case 400:
        return new ItzamValidationError(message);
      case 401:
        return new ItzamAuthenticationError(message);
      case 404:
        return new ItzamNotFoundError(message);
      case 500:
        return new ItzamServerError(message);
      default:
        return new ItzamError(message, 500);
    }
  }

  return new ItzamError(error?.message || 'Unknown error', 500);
}
