import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { generateSwaggerSpec } from "@/lib/swagger";

function loadSwaggerSpec() {
  const specPath = join(process.cwd(), "public", "openapi.json");
  if (existsSync(specPath)) {
    return JSON.parse(readFileSync(specPath, "utf8"));
  }
  return generateSwaggerSpec();
}

export async function GET() {
  return NextResponse.json(loadSwaggerSpec());
}
