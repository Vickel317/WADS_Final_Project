import { prisma } from "@/lib/prisma";

export function isPlatformAdmin(role?: string | null) {
  return String(role ?? "").toLowerCase() === "admin";
}

export async function getModeratedForumIds(userId: string): Promise<string[]> {
  const rows = await prisma.forumModerator.findMany({
    where: { userID: userId },
    select: { forumID: true },
  });
  return rows.map((r) => r.forumID);
}

export async function isForumMember(userId: string, forumId: string): Promise<boolean> {
  const row = await prisma.forumMember.findUnique({
    where: { forumID_userID: { forumID: forumId, userID: userId } },
  });
  return Boolean(row);
}

export async function isForumModerator(userId: string, forumId: string): Promise<boolean> {
  const row = await prisma.forumModerator.findUnique({
    where: { forumID_userID: { forumID: forumId, userID: userId } },
  });
  return Boolean(row);
}

export async function canManageForum(
  userId: string,
  forumId: string,
  globalRole?: string | null
): Promise<boolean> {
  if (isPlatformAdmin(globalRole)) return true;
  return isForumModerator(userId, forumId);
}

export async function canModerateForumContent(
  userId: string,
  forumId: string,
  globalRole?: string | null
): Promise<boolean> {
  return canManageForum(userId, forumId, globalRole);
}

export async function canAccessModerationQueue(
  userId: string,
  globalRole?: string | null
): Promise<boolean> {
  if (isPlatformAdmin(globalRole)) return true;
  const count = await prisma.forumModerator.count({ where: { userID: userId } });
  return count > 0;
}
