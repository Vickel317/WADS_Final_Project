import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";

/**
 * GET /api/collaboration
 *   returns a list of collaboration spaces the user can see
 * POST /api/collaboration
 *   creates a new collaboration space
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request.headers);
    if (!session) return apiError(401, "Not authenticated", "UNAUTHORIZED");

    // For now return spaces where the user is a member or all public spaces
    const spaces = await prisma.collabSpace.findMany({
      include: { members: { include: { user: { select: { userId: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ spaces }, { status: 200 });
  } catch (err) {
    console.error("Get collaboration spaces error:", err);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request.headers);
    if (!session) {
      console.warn("Create collaboration: no session (unauthenticated)");
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const body = await request.json();
    const { name, description, forumID } = body as {
      name?: string;
      description?: string;
      forumID?: string;
    };

    if (!name || typeof name !== "string") {
      return apiError(400, "Missing required field: name", "BAD_REQUEST");
    }

    console.log("Create collaboration payload:", { name, description, forumID, user: session.user.userId });
    let space;
    try {
      let finalForumID = forumID ?? "";
      if (!finalForumID || finalForumID.trim() === "") {
        // No forum provided — create a lightweight ForumHub to satisfy FK
        const forum = await prisma.forumHub.create({
          data: {
            name: `forum-for-${Date.now()}`,
            description: `Auto-created for space ${name}`,
          },
        });
        finalForumID = forum.forumID;
      }

      space = await prisma.collabSpace.create({
        data: {
          name,
          description: description ?? null,
          forumID: finalForumID,
        },
      });
    } catch (err: any) {
      console.error("Prisma create collabSpace error:", err);
      return apiError(500, err?.message || "Internal server error", "INTERNAL_ERROR");
    }

    // Add creator as a member
    await prisma.spaceMember.create({
      data: {
        spaceID: space.spaceID,
        userID: session.user.userId,
        role: "OWNER",
      },
    });

    return NextResponse.json({ space }, { status: 201 });
  } catch (err) {
    console.error("Create collaboration space error:", err);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
