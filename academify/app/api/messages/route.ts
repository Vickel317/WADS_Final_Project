import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get all conversations for current user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const currentUserId = sessionUser.user.userId;
    // Fetch recent messages involving the user
    const records = await prisma.message.findMany({
      where: {
        OR: [{ senderID: currentUserId }, { receiverID: currentUserId }],
      },
      orderBy: { sentAt: "desc" },
      include: {
        sender: { select: { userId: true, name: true, avatarUrl: true } },
        receiver: { select: { userId: true, name: true, avatarUrl: true } },
      },
    });

    // Load spaces the user is a member of and their member lists so we can
    // surface space conversations (they are stored as per-recipient messages).
    const userSpaces = await prisma.spaceMember.findMany({
      where: { userID: currentUserId },
      select: { spaceID: true },
    });
    const spaceIds = userSpaces.map((s) => s.spaceID);
    const spaceMembers =
      spaceIds.length > 0
        ? await prisma.spaceMember.findMany({ where: { spaceID: { in: spaceIds } }, select: { spaceID: true, userID: true } })
        : [];
    const membersBySpace = new Map<string, Set<string>>();
    for (const m of spaceMembers) {
      if (!membersBySpace.has(m.spaceID)) membersBySpace.set(m.spaceID, new Set());
      membersBySpace.get(m.spaceID)!.add(m.userID);
    }
    const spaces =
      spaceIds.length > 0
        ? await prisma.collabSpace.findMany({ where: { spaceID: { in: spaceIds } }, select: { spaceID: true, name: true } })
        : [];
    const spaceNameById = new Map(spaces.map((s) => [s.spaceID, s.name]));

    const conversationMap = new Map<
      string,
      {
        userId: string;
        kind: "direct" | "space";
        name: string;
        avatarUrl: string | null;
        lastMessage: string;
        lastAt: string;
        unread: number;
      }
    >();

    records.forEach((message) => {
      // Skip self-only system messages
      if (message.senderID === currentUserId && message.receiverID === currentUserId) {
        return;
      }

      // If the message has a spaceID set, treat it as a space message
      // regardless of the sender/receiver pairing. This makes space-origin
      // messages distinct from direct messages between two users.
      if (message.spaceID) {
        const convKey = `space-${message.spaceID}`;
        const existing = conversationMap.get(convKey);
        const name = spaceNameById.get(message.spaceID) ?? `Space ${message.spaceID}`;
        if (!existing) {
          conversationMap.set(convKey, {
            userId: convKey,
            kind: "space",
            name,
            avatarUrl: null,
            lastMessage: message.content,
            lastAt: message.sentAt.toISOString(),
            unread: 0,
          });
        }
        if (message.receiverID === currentUserId && !message.read) {
          const entry = conversationMap.get(convKey);
          if (entry) entry.unread += 1;
        }
        return;
      }

      // Fallback: regular DM-style conversation between two users
      const isSender = message.senderID === currentUserId;
      const partnerId = isSender ? message.receiverID : message.senderID;
      const partnerName = isSender
        ? message.receiver?.name || "Unknown User"
        : message.sender?.name || "Unknown User";
      const partnerAvatarUrl = isSender
        ? (message.receiver?.avatarUrl ?? null)
        : (message.sender?.avatarUrl ?? null);

      const existing = conversationMap.get(partnerId);
      if (!existing) {
        conversationMap.set(partnerId, {
          userId: partnerId,
          kind: "direct",
          name: partnerName,
          avatarUrl: partnerAvatarUrl,
          lastMessage: message.content,
          lastAt: message.sentAt.toISOString(),
          unread: 0,
        });
      }

      if (message.receiverID === currentUserId && !message.read) {
        const entry = conversationMap.get(partnerId);
        if (entry) {
          entry.unread += 1;
        }
      }
    });

    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    );

    // Ensure spaces the user is a member of appear even if no messages exist yet.
    for (const s of spaces) {
      const convKey = `space-${s.spaceID}`;
      if (!conversationMap.has(convKey)) {
        conversationMap.set(convKey, {
          userId: convKey,
          kind: "space",
          name: s.name,
          avatarUrl: null,
          lastMessage: "",
          lastAt: new Date(0).toISOString(),
          unread: 0,
        });
      }
    }

    const conversationsWithSpaces = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    );

    return NextResponse.json({ conversations: conversationsWithSpaces }, { status: 200 });
  } catch (error) {
    console.error("Get conversations error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

