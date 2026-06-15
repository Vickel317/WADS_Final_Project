import { NextRequest, NextResponse } from "next/server";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { apiError } from "@/lib/api-response";
import { canViewPost } from "@/lib/post-visibility";
import { slugify } from "@/lib/slugify";

export async function GET(request: NextRequest) {
  try {
    const sessionData = await getSession();
    if (!sessionData) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(10, Math.max(1, parseInt(searchParams.get("limit") || "5", 10)));

    if (!query) {
      return NextResponse.json({ users: [], forums: [], threads: [] });
    }

    const currentUserId = sessionData.user.userId;
    const viewerRole = sessionData.user.role;

    const moderatedForumIds = await prisma.forumModerator
      .findMany({
        where: { userID: currentUserId },
        select: { forumID: true },
      })
      .then((rows) => rows.map((row) => row.forumID));

    const [users, forums, posts] = await Promise.all([
      prisma.user.findMany({
        where: {
          NOT: { userId: currentUserId },
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limit,
        select: {
          userId: true,
          name: true,
          username: true,
          followers: { where: { followerId: currentUserId } },
          following: { where: { followingId: currentUserId } },
        },
      }),
      prisma.forumHub.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limit,
        select: {
          forumID: true,
          name: true,
          description: true,
        },
      }),
      prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limit * 2,
        orderBy: { createdAt: "desc" },
        select: {
          postID: true,
          title: true,
          moderationStatus: true,
          authorID: true,
          forumID: true,
          forum: { select: { name: true } },
        },
      }),
    ]);

    const viewer = {
      id: currentUserId,
      role: viewerRole,
      moderatedForumIds,
    };

    const visibleThreads = posts
      .filter((post) => canViewPost(post, viewer))
      .slice(0, limit)
      .map((post) => ({
        postId: post.postID,
        title: post.title,
        forumName: post.forum.name,
        forumSlug: slugify(post.forum.name),
        moderationStatus:
          post.moderationStatus === ModerationStatus.APPROVED ? undefined : post.moderationStatus,
      }));

    return NextResponse.json({
      users: users.map((user) => {
        const isFollowing = user.followers.length > 0;
        const isFollower = user.following.length > 0;
        return {
          userId: user.userId,
          name: user.name,
          username: user.username,
          isConnected: isFollowing && isFollower,
        };
      }),
      forums: forums.map((forum) => ({
        forumId: forum.forumID,
        name: forum.name,
        description: forum.description ?? "",
        slug: slugify(forum.name),
      })),
      threads: visibleThreads,
    });
  } catch (error) {
    console.error("Search error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
