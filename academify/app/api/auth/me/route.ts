import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";


export async function GET(request: NextRequest) {
  try {
    const mod = await import("@/lib/auth");
    const auth = await mod.getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    return NextResponse.json(
      {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || "",
        role: "student",
        createdAt: session.user.createdAt
          ? new Date(session.user.createdAt).toISOString()
          : null,
        updatedAt: session.user.updatedAt
          ? new Date(session.user.updatedAt).toISOString()
          : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user error:", error);
    return apiError(401, "Not authenticated", "UNAUTHORIZED");
  }
}
