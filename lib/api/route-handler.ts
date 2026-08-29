import "server-only";
import { type NextRequest } from "next/server";
import { ZodError, type ZodType, type ZodTypeDef } from "zod";

import { connectToDatabase } from "@/lib/db/mongoose";
import { ApiError, BadRequestError, ValidationError } from "@/lib/api/errors";
import { jsonError } from "@/lib/api/response";

type Ctx<P extends Record<string, string>> = { params: Promise<P> };

// Wraps every /api/v1 handler: ensures the DB connection, awaits params, and
// turns any thrown error into the canonical failure shape.
export function withRoute<P extends Record<string, string> = Record<string, string>>(
  handler: (req: NextRequest, ctx: { params: P }) => Promise<Response>,
) {
  return async (req: NextRequest, ctx: Ctx<P>): Promise<Response> => {
    try {
      await connectToDatabase();
      return await handler(req, { params: await ctx.params });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

function toErrorResponse(error: unknown): Response {
  if (error instanceof ApiError) return jsonError(error.status, error.toBody());

  if (error instanceof ZodError) {
    return jsonError(422, {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: error.flatten().fieldErrors as Record<string, string[]>,
    });
  }

  if (typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000) {
    return jsonError(409, { code: "CONFLICT", message: "Resource already exists" });
  }

  console.error("[api] unhandled error:", error);
  return jsonError(500, { code: "INTERNAL_ERROR", message: "Internal server error" });
}

export async function parseJsonBody<Output>(
  req: NextRequest,
  schema: ZodType<Output, ZodTypeDef, unknown>,
): Promise<Output> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError(result.error.flatten().fieldErrors as Record<string, string[]>);
  }
  return result.data;
}

export function parseQuery<Output>(
  req: NextRequest,
  schema: ZodType<Output, ZodTypeDef, unknown>,
): Output {
  const result = schema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!result.success) {
    throw new ValidationError(result.error.flatten().fieldErrors as Record<string, string[]>);
  }
  return result.data;
}
