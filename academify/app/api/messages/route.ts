import { NextRequest, NextResponse } from "next/server";

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

// TODO: replace with Prisma in Week 7
export let messages: Array<{
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}> = [
  {
    id: "1",
    senderId: "user1",
    receiverId: "current-user",
    content: "Hey, want to study together?",
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: "2",
    senderId: "current-user",
    receiverId: "user2",
    content: "Sure! When are you free?",
    createdAt: new Date().toISOString(),
    read: true,
  },
  {
    id: "3",
    senderId: "user2",
    receiverId: "current-user",
    content: "How about tomorrow at 3PM?",
    createdAt: new Date().toISOString(),
    read: false,
  },
];

export const dummyUsers: Record<string, string> = {
  "user1": "Alex Turner",
  "user2": "Sarah Chen",
  "user3": "Mike Johnson",
  "current-user": "John Doe",
};

export async function GET(request: NextRequest) {
  try {
    // TODO: get currentUserId from JWT token in Week 8
    const currentUserId = "current-user";

    // Get unique conversation partners
    const partnerIds = new Set<string>();
    messages.forEach((m) => {
      if (m.senderId === currentUserId) partnerIds.add(m.receiverId);
      if (m.receiverId === currentUserId) partnerIds.add(m.senderId);
    });

    // Build conversation list
    const conversations = Array.from(partnerIds).map((partnerId) => {
      const conversation = messages
        .filter(
          (m) =>
            (m.senderId === currentUserId && m.receiverId === partnerId) ||
            (m.senderId === partnerId && m.receiverId === currentUserId)
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      const unread = conversation.filter(
        (m) => m.receiverId === currentUserId && !m.read
      ).length;

      return {
        userId: partnerId,
        name: dummyUsers[partnerId] || "Unknown User",
        lastMessage: conversation[0]?.content || "",
        lastAt: conversation[0]?.createdAt || "",
        unread,
      };
    });

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}