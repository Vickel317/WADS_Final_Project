import { NextResponse } from "next/server";

export function handleApiError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "test") {
    console.error(context, error);
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
