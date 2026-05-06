import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    const mod = await import("@/lib/auth");
    const auth = await mod.getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
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
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
