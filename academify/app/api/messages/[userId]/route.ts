import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/error-handler";
import { validateCreateMessagePayload } from "@/lib/security";
import { messages, dummyUsers } from "@/app/api/messages/route";

/**
 * @swagger
 * /api/messages/{userId}:
 *   get:
 *     summary: Get all messages with a specific user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to get messages with
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Send a message to a specific user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: Hey, want to study together?
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Message content is required
 *       404:
 *         description: Recipient not found
 *       500:
 *         description: Internal server error
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // TODO: get currentUserId from JWT token in Week 8
    const currentUserId = "current-user";
    const partnerId = params.userId;

    if (!dummyUsers[partnerId]) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get messages between the two users
    const conversation = messages
      .filter(
        (m) =>
          (m.senderId === currentUserId && m.receiverId === partnerId) ||
          (m.senderId === partnerId && m.receiverId === currentUserId)
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    // Mark messages as read
    conversation.forEach((m) => {
      if (m.receiverId === currentUserId) {
        m.read = true;
      }
    });

    return NextResponse.json({ messages: conversation }, { status: 200 });
  } catch (error) {
    return handleApiError("Get messages error:", error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const body = await request.json();
    const validationResult = validateCreateMessagePayload({
      content: body?.content,
      receiverId: params.userId,
    });
    if (!validationResult.ok) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    const { content } = validationResult.data;

    const receiverId = params.userId;

    if (!dummyUsers[receiverId]) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // TODO: get senderId from JWT token in Week 8
    const newMessage = {
      id: Date.now().toString(),
      senderId: "current-user",
      receiverId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    messages.push(newMessage);

    return NextResponse.json(
      { message: "Message sent successfully", data: newMessage },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError("Send message error:", error);
  }
}
