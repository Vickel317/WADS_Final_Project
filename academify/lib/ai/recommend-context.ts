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

  const postedForums = await prisma.post.findMany({
    where: { authorID: userId },
    select: {
      forumID: true,
      forum: { select: { name: true } },
    },
    distinct: ["forumID"],
    take: 12,
  });

  return {
    profile: {
      major: user?.major ?? null,
      bio: user?.bio ?? null,
      skillTags: user?.skillTags ?? [],
      academicLevel: user?.academicLevel ?? null,
    },
    joinedForumIds: postedForums.map((entry) => entry.forumID),
    joinedForumNames: postedForums.map((entry) => entry.forum.name),
  };
}
