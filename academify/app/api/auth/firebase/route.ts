import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "This legacy Firebase endpoint has been retired. Use BetterAuth endpoints under /api/auth instead.",
    },
    { status: 410 }
  );
}

