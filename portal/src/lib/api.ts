import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Wraps an API route handler so I don't have to repeat the same try/catch
// in every file. Converts known error types (Zod, AuthError) to JSON.
export function apiRoute<TArgs extends unknown[], TResp>(
  handler: (...args: TArgs) => Promise<TResp>
) {
  return async (...args: TArgs) => {
    try {
      return (await handler(...args)) as unknown as NextResponse;
    } catch (err) {
      // AuthError and ZodError are expected user-facing conditions, not bugs;
      // they're returned as JSON without being logged as server errors.
      if (err instanceof AuthError) {
        return jsonError(err.message, err.status);
      }
      if (err instanceof ZodError) {
        return jsonError(err.issues.map((i) => i.message).join("; "), 400);
      }
      console.error("API error:", err);
      return jsonError("Internal server error", 500);
    }
  };
}
