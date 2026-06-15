import { prisma } from "@/lib/prisma";

export type RecommendUserContext = {
  profile: {
    major: string | null;
    bio: string | null;
    skillTags: string[];
    academicLevel: string | null;
  };
  joinedForumIds: string[];
  joinedForumNames: string[];
};

export async function getRecommendUserContext(userId: string): Promise<RecommendUserContext> {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      major: true,
      bio: true,
      skillTags: true,
      academicLevel: true,
    },
  });

  const [memberships, postedForums] = await Promise.all([
    prisma.forumMember.findMany({
      where: { userID: userId },
      select: { forum: { select: { forumID: true, name: true } } },
      take: 12,
    }),
    prisma.post.findMany({
      where: { authorID: userId },
      select: {
        forumID: true,
        forum: { select: { name: true } },
      },
      distinct: ["forumID"],
      take: 12,
    }),
  ]);

  const forumMap = new Map<string, string>();
  for (const entry of memberships) {
    forumMap.set(entry.forum.forumID, entry.forum.name);
  }
  for (const entry of postedForums) {
    forumMap.set(entry.forumID, entry.forum.name);
  }

  return {
    profile: {
      major: user?.major ?? null,
      bio: user?.bio ?? null,
      skillTags: user?.skillTags ?? [],
      academicLevel: user?.academicLevel ?? null,
    },
    joinedForumIds: [...forumMap.keys()],
    joinedForumNames: [...forumMap.values()],
  };
}
