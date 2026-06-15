import { DMRestriction, User } from "@prisma/client";

type MessageParticipant = Pick<User, "userId" | "role" | "dmRestriction">;

export async function areUsersConnected(
  userId: string,
  otherUserId: string,
  findFollow: (args: {
    where: { followerId: string; followingId: string };
  }) => Promise<{ followerId: string } | null>
) {
  const [aFollowsB, bFollowsA] = await Promise.all([
    findFollow({ where: { followerId: userId, followingId: otherUserId } }),
    findFollow({ where: { followerId: otherUserId, followingId: userId } }),
  ]);
  return Boolean(aFollowsB && bFollowsA);
}

export function canSendDirectMessage(
  sender: MessageParticipant,
  receiver: MessageParticipant,
  isConnected: boolean
) {
  if (sender.userId === receiver.userId) {
    return false;
  }

  switch (receiver.dmRestriction) {
    case DMRestriction.NONE:
      return false;
    case DMRestriction.CONNECTIONS:
      return isConnected;
    case DMRestriction.LECTURERS:
      return sender.role === "LECTURER";
    case DMRestriction.ALL:
    default:
      return true;
  }
}
