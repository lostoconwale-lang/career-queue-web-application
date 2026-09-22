import type { ApiErrorBody } from "@/types/api";

// Throw these anywhere; the route wrapper renders them as consistent JSON.
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string[]>;

  constructor(status: number, code: string, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  toBody(): ApiErrorBody {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request") {
    super(400, "BAD_REQUEST", message);
  }
}

export class ValidationError extends ApiError {
  constructor(details: Record<string, string[]>, message = "Validation failed") {
    super(422, "VALIDATION_ERROR", message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
  }
}

// Distinct codes (not just FORBIDDEN) so the login form can tell these apart
// from a generic denial and show the right popup instead of a plain banner.
export class EmailNotVerifiedError extends ApiError {
  constructor(message = "Please verify your email address to continue") {
    super(403, "EMAIL_NOT_VERIFIED", message);
  }
}

export class PhoneNotVerifiedError extends ApiError {
  constructor(message = "Please verify your mobile number to continue") {
    super(403, "PHONE_NOT_VERIFIED", message);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = "Resource") {
    super(404, "NOT_FOUND", `${resource} not found`);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(409, "CONFLICT", message);
  }
}
