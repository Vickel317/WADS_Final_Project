import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export type RecentForumEntry = {
  forumID: string;
  name: string;
  slug: string;
  lastActivityAt: Date;
  source: "joined" | "posted" | "commented" | "collab";
};

/** Forums the user has joined or recently engaged with. */
export async function getRecentForumsForUser(
  userId: string,
  limit = 5
): Promise<RecentForumEntry[]> {
  const byForum = new Map<string, RecentForumEntry>();

  const memberships = await prisma.forumMember.findMany({
    where: { userID: userId },
    orderBy: { joinedAt: "desc" },
    take: limit * 2,
    include: {
      forum: { select: { forumID: true, name: true } },
    },
  });

  for (const membership of memberships) {
    byForum.set(membership.forum.forumID, {
      forumID: membership.forum.forumID,
      name: membership.forum.name,
      slug: slugify(membership.forum.name),
      lastActivityAt: membership.joinedAt,
      source: "joined",
    });
  }

  const posts = await prisma.post.findMany({
    where: { authorID: userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      createdAt: true,
      forum: { select: { forumID: true, name: true } },
    },
  });

  for (const post of posts) {
    const existing = byForum.get(post.forum.forumID);
    if (!existing || post.createdAt > existing.lastActivityAt) {
      byForum.set(post.forum.forumID, {
        forumID: post.forum.forumID,
        name: post.forum.name,
        slug: slugify(post.forum.name),
        lastActivityAt: post.createdAt,
        source: existing?.source === "joined" ? "joined" : "posted",
      });
    }
  }

  const comments = await prisma.comment.findMany({
    where: { authorID: userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      createdAt: true,
      post: {
        select: {
          forum: { select: { forumID: true, name: true } },
        },
      },
    },
  });

  for (const comment of comments) {
    const forum = comment.post.forum;
    const existing = byForum.get(forum.forumID);
    if (!existing || comment.createdAt > existing.lastActivityAt) {
      byForum.set(forum.forumID, {
        forumID: forum.forumID,
        name: forum.name,
        slug: slugify(forum.name),
        lastActivityAt: comment.createdAt,
        source: existing?.source === "joined" ? "joined" : "commented",
      });
    }
  }

  const spaces = await prisma.spaceMember.findMany({
    where: { userID: userId },
    select: {
      joinedAt: true,
      space: {
        select: {
          forum: { select: { forumID: true, name: true } },
        },
      },
    },
  });

  for (const membership of spaces) {
    const forum = membership.space.forum;
    const existing = byForum.get(forum.forumID);
    if (!existing || membership.joinedAt > existing.lastActivityAt) {
      byForum.set(forum.forumID, {
        forumID: forum.forumID,
        name: forum.name,
        slug: slugify(forum.name),
        lastActivityAt: membership.joinedAt,
        source: existing?.source === "joined" ? "joined" : "collab",
      });
    }
  }

  return Array.from(byForum.values())
    .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())
    .slice(0, limit);
}
