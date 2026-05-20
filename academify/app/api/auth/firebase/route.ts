import { apiError } from "@/lib/api-response";

export async function POST() {
  return apiError(
    410,
    "This legacy Firebase endpoint has been retired. Use BetterAuth endpoints under /api/auth instead.",
    "BAD_REQUEST"
  );
}

