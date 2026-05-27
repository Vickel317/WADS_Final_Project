import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getAccessibleFileWhere(userId: string): Promise<Prisma.FileWhereInput> {
  const memberships = await prisma.spaceMember.findMany({
    where: { userID: userId },
    select: { spaceID: true },
  });

  const memberSpaceIds = memberships.map((membership) => membership.spaceID);
  const accessClauses: Prisma.FileWhereInput[] = [{ uploadedByID: userId }];

  if (memberSpaceIds.length > 0) {
    accessClauses.push({ spaceID: { in: memberSpaceIds } });
  }

  return { OR: accessClauses };
}

export async function canAccessFile(
  file: { fileID: string; uploadedByID: string; spaceID: string | null },
  userId: string
) {
  if (file.uploadedByID === userId) {
    return true;
  }

  if (!file.spaceID) {
    return false;
  }

  const membership = await prisma.spaceMember.findUnique({
    where: {
      spaceID_userID: {
        spaceID: file.spaceID,
        userID: userId,
      },
    },
  });

  return Boolean(membership);
}