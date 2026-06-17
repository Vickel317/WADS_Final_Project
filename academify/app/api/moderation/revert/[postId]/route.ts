import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { parseJson, parseOptionalString } from "@/lib/validation";
import { canModerateForumContent } from "@/lib/forum-permissions";
import { recordModerationAction } from "@/lib/moderation";

/**
 * POST /api/moderation/revert/[postId]
 * Revert an AI-approved post back to flagged or blocked (moderator/admin only).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const body = await parseJson<{ target?: unknown; reason?: unknown }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const targetRaw = typeof body.target === "string" ? body.target.toLowerCase() : "";
    if (targetRaw !== "flagged" && targetRaw !== "blocked") {
      return apiError(400, "target must be 'flagged' or 'blocked'", "BAD_REQUEST");
    }

    const reason = parseOptionalString(body.reason);
    if (reason.error) {
      return apiError(400, "Invalid request", "BAD_REQUEST", [
        { field: "reason", message: `reason ${reason.error}` },
      ]);
    }

    const { postId } = await params;
    const existing = await prisma.post.findUnique({ where: { postID: postId } });

    if (!existing) {
      return apiError(404, "Post not found", "NOT_FOUND");
    }

    if (!(await canModerateForumContent(decoded.id, existing.forumID, decoded.role))) {
      return apiError(403, "Forbidden: Moderator or Admin access required", "FORBIDDEN");
    }

    if (existing.moderationStatus !== ModerationStatus.APPROVED) {
      return apiError(
        400,
        "Only approved posts can be reverted",
        "BAD_REQUEST"
      );
    }

    const nextStatus =
      targetRaw === "blocked" ? ModerationStatus.BLOCKED : ModerationStatus.FLAGGED;

    const updatedPost = await prisma.post.update({
      where: { postID: postId },
      data: { moderationStatus: nextStatus },
    });

    await recordModerationAction({
      moderatorId: decoded.id,
      actionType: "FLAG_POST",
      targetPostID: postId,
      reason: reason.value || `Reverted approved post to ${targetRaw}`,
      details: `human_revert:${targetRaw}`,
    });

    return NextResponse.json(
      {
        message: `Post reverted to ${targetRaw}`,
        post: {
          id: updatedPost.postID,
          title: updatedPost.title,
          status: updatedPost.moderationStatus.toLowerCase(),
          updatedAt: updatedPost.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Revert post error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
