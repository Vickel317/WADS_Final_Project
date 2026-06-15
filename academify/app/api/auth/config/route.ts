import { NextResponse } from "next/server";
import { getGoogleAuthPublicConfig } from "@/lib/google-auth-config";

export async function GET() {
  return NextResponse.json(getGoogleAuthPublicConfig());
}
