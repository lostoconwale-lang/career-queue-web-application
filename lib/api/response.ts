import { NextResponse } from "next/server";

import type { ApiErrorBody, ApiFailure, ApiResponse, CursorPage } from "@/types/api";

// The only place /api/v1 builds a JSON response.

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data } satisfies ApiResponse<T>, { status });
}

export function jsonCreated<T>(data: T): NextResponse {
  return jsonOk(data, 201);
}

export function jsonNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function jsonError(status: number, error: ApiErrorBody): NextResponse {
  return NextResponse.json({ success: false, error } satisfies ApiFailure, { status });
}

/**
 * Build a cursor page from rows fetched with `.limit(limit + 1)`: the extra row
 * (if present) tells us there's a next page and gives us its starting cursor.
 */
export function cursorPage<T extends { id: string }>(rows: T[], limit: number): CursorPage<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  return { items, hasMore, nextCursor: hasMore && last ? last.id : null };
}
