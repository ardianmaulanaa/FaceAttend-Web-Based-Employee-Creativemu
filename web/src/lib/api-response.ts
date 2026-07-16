import { NextResponse } from "next/server";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";

export function jsonOk<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

export function jsonMessageError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status },
  );
}

export function jsonApiError(error: unknown, fallback: string) {
  return NextResponse.json(
    {
      success: false,
      message: getApiErrorMessage(error, fallback),
    },
    { status: getApiErrorStatus(error) },
  );
}
