import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { parseJson, parseRequiredString } from "@/lib/validation";

async function getSpaceMemberIds(spaceId: string) {
  const members = await prisma.spaceMember.findMany({
    where: { spaceID: spaceId },
    select: { userID: true },
  });

  return members.map((member) => member.userID);
}

async function ensureSpaceMembership(spaceId: string, userId: string) {
  const space = await prisma.collabSpace.findUnique({
    where: { spaceID: spaceId },
    select: { spaceID: true },
  });

  if (!space) {
    return false;
  }

  await prisma.spaceMember.upsert({
    where: { spaceID_userID: { spaceID: spaceId, userID: userId } },
    update: {},
    create: {
      spaceID: spaceId,
      userID: userId,
      role: "MEMBER",
    },
  });

  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const currentUserId = sessionUser.user.userId;
    const { spaceId } = await params;

    const isMember = await ensureSpaceMembership(spaceId, currentUserId);
    if (!isMember) {
      return apiError(404, "Space not found", "NOT_FOUND");
    }

    const memberIds = await getSpaceMemberIds(spaceId);
    const sinceParam = request.nextUrl.searchParams.get("since");
    const sinceDate = sinceParam ? new Date(sinceParam) : null;

    const conversation = await prisma.message.findMany({
      where: {
        // Only include messages that are explicitly associated with this space.
        spaceID: spaceId,
        receiverID: currentUserId,
        senderID: { in: memberIds },
        ...(sinceDate ? { sentAt: { gt: sinceDate } } : {}),
      },
      orderBy: { sentAt: "asc" },
      include: {
        sender: {
          select: {
            userId: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        messages: conversation.map((message) => ({
          id: message.messageID,
          senderId: message.senderID,
          senderName: message.sender?.name ?? "Unknown User",
          senderAvatarUrl: message.sender?.avatarUrl ?? null,
          receiverId: `space-${spaceId}`,
          content: message.content,
          createdAt: message.sentAt.toISOString(),
          read: message.read,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get space messages error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const body = await parseJson<{ content?: unknown }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const content = parseRequiredString(body.content);
    if (content.error) {
      return apiError(400, "Invalid request", "BAD_REQUEST", [
        { field: "content", message: `content ${content.error}` },
      ]);
    }

    const currentUserId = sessionUser.user.userId;
    const { spaceId } = await params;

    const isMember = await ensureSpaceMembership(spaceId, currentUserId);
    if (!isMember) {
      return apiError(404, "Space not found", "NOT_FOUND");
    }

    const memberIds = await getSpaceMemberIds(spaceId);
    const recipientIds = memberIds.filter((id) => id !== currentUserId);

    let selfMessage;
    let usedSpaceFlag = true;
    try {
      selfMessage = await prisma.message.create({
        data: {
          senderID: currentUserId,
          receiverID: currentUserId,
          spaceID: spaceId,
          content: content.value!,
          read: true,
        },
      });

      if (recipientIds.length > 0) {
        await prisma.message.createMany({
          data: recipientIds.map((receiverID) => ({
            senderID: currentUserId,
            receiverID,
            spaceID: spaceId,
            content: content.value!,
            read: false,
          })),
        });
      }
    } catch (err) {
      // Prisma client may not yet have the updated `spaceID` field (no migration/generate run).
      // Fall back to creating messages without the `spaceID` scalar so the send flow still works.
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Unknown argument `spaceID`") || msg.includes("Unknown arg \"spaceID\"")) {
        usedSpaceFlag = false;
        selfMessage = await prisma.message.create({
          data: {
            senderID: currentUserId,
            receiverID: currentUserId,
            content: content.value!,
            read: true,
          },
        });

        if (recipientIds.length > 0) {
          await prisma.message.createMany({
            data: recipientIds.map((receiverID) => ({
              senderID: currentUserId,
              receiverID,
              content: content.value!,
              read: false,
            })),
          });
        }
      } else {
        throw err;
      }
    }

    return NextResponse.json(
      {
        message: "Message sent successfully",
        data: {
          id: selfMessage.messageID,
          senderId: selfMessage.senderID,
          senderName: sessionUser.user.name,
          senderAvatarUrl: sessionUser.user.avatarUrl ?? null,
          receiverId: `space-${spaceId}`,
          content: selfMessage.content,
          createdAt: selfMessage.sentAt.toISOString(),
          read: selfMessage.read,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Send space message error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return apiError(500, `Internal server error: ${msg}`, "INTERNAL_ERROR");
  }
}
