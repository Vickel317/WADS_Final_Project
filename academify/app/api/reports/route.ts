import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// TODO: replace with Prisma in Week 7
export let reports: Array<{
  id: string;
  reportedBy: string;
  targetType: "post" | "comment" | "user";
  targetId: string;
  reason: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  reviewNote?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt?: string;
}> = [
  {
    id: "rep_1",
    reportedBy: "user_1",
    targetType: "post",
    targetId: "2",
    reason: "Spam content",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

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

function isModOrAdmin(role?: string) {
  return role === "moderator" || role === "admin";
}

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all reports (Moderator/Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, resolved, dismissed]
 *         description: Filter by report status
 *     responses:
 *       200:
 *         description: List of reports
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Moderator/Admin only
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Submit a new report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetType, targetId, reason]
 *             properties:
 *               targetType:
 *                 type: string
 *                 enum: [post, comment, user]
 *                 example: post
 *               targetId:
 *                 type: string
 *                 example: "1"
 *               reason:
 *                 type: string
 *                 example: This post contains spam.
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!isModOrAdmin(decoded.role)) {
      return NextResponse.json(
        { error: "Forbidden: Moderator or Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const filtered = status
      ? reports.filter((r) => r.status === status)
      : reports;

    return NextResponse.json({ reports: filtered }, { status: 200 });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { targetType, targetId, reason } = body;

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: "targetType, targetId, and reason are required" },
        { status: 400 }
      );
    }

    if (!["post", "comment", "user"].includes(targetType)) {
      return NextResponse.json(
        { error: "targetType must be post, comment, or user" },
        { status: 400 }
      );
    }

    const newReport = {
      id: `rep_${Date.now()}`,
      reportedBy: decoded.id,
      targetType: targetType as "post" | "comment" | "user",
      targetId,
      reason,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };

    reports.push(newReport);

    return NextResponse.json(
      { message: "Report submitted successfully", report: newReport },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
