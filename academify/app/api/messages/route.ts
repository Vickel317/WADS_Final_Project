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
    const records = await prisma.message.findMany({
      where: {
        OR: [{ senderID: currentUserId }, { receiverID: currentUserId }],
      },
      orderBy: { sentAt: "desc" },
      include: {
        sender: { select: { userId: true, name: true } },
        receiver: { select: { userId: true, name: true } },
      },
    });

    const conversationMap = new Map<
      string,
      { userId: string; name: string; lastMessage: string; lastAt: string; unread: number }
    >();

    records.forEach((message) => {
      const isSender = message.senderID === currentUserId;
      const partnerId = isSender ? message.receiverID : message.senderID;
      const partnerName = isSender
        ? message.receiver?.name || "Unknown User"
        : message.sender?.name || "Unknown User";

      const existing = conversationMap.get(partnerId);
      if (!existing) {
        conversationMap.set(partnerId, {
          userId: partnerId,
          name: partnerName,
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

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    console.error("Get conversations error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

