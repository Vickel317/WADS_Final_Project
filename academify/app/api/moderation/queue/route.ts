import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { threads } from "@/app/api/posts/route";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Shared moderation log (imported by other moderation routes)
export let moderationLogs: Array<{
  id: string;
  action:
    | "approve"
    | "delete"
    | "warn"
    | "suspend"
    | "ban"
    | "report_resolved"
    | "report_dismissed";
  targetType: "post" | "user";
  targetId: string;
  performedBy: string;
  reason?: string;
  createdAt: string;
}> = [];

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role?: string;
    };
  } catch {
    return null;
  }
}

/**
 * @swagger
 * /api/moderation/queue:
 *   get:
 *     summary: Get content pending moderation (Moderator/Admin only)
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of posts pending moderation
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Moderator/Admin only
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (decoded.role !== "moderator" && decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Moderator or Admin access required" },
        { status: 403 }
      );
    }

    // Return posts flagged for review (status === "pending")
    const queue = threads.filter(
      (t) => (t as { status?: string }).status === "pending"
    );

    return NextResponse.json(
      { queue, total: queue.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get moderation queue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
