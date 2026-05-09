import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type ApiErrorDetail = {
  field?: string;
  message: string;
};

export function apiError(
  status: number,
  message: string,
  code: ApiErrorCode,
  details?: ApiErrorDetail[]
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details?.length ? details : undefined,
      },
    },
    { status }
  );
}
