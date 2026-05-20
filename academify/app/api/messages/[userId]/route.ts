import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { parseJson, parseRequiredString } from "@/lib/validation";

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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const currentUserId = sessionUser.user.userId;
    const { userId: partnerId } = await params;

    const partner = await prisma.user.findUnique({ where: { userId: partnerId } });
    if (!partner) {
      return apiError(404, "User not found", "NOT_FOUND");
    }

    // ?since=<ISO timestamp> — return only messages after this point (catch-up after reconnect)
    const sinceParam = request.nextUrl.searchParams.get("since");
    const sinceDate = sinceParam ? new Date(sinceParam) : null;

    await prisma.message.updateMany({
      where: {
        senderID: partnerId,
        receiverID: currentUserId,
        read: false,
      },
      data: { read: true },
    });

    const conversation = await prisma.message.findMany({
      where: {
        OR: [
          { senderID: currentUserId, receiverID: partnerId },
          { senderID: partnerId, receiverID: currentUserId },
        ],
        ...(sinceDate ? { sentAt: { gt: sinceDate } } : {}),
      },
      orderBy: { sentAt: "asc" },
    });

    return NextResponse.json(
      {
        messages: conversation.map((message) => ({
          id: message.messageID,
          senderId: message.senderID,
          receiverId: message.receiverID,
          content: message.content,
          createdAt: message.sentAt.toISOString(),
          read: message.read,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get messages error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const { userId: receiverId } = await params;

    const receiver = await prisma.user.findUnique({ where: { userId: receiverId } });
    if (!receiver) {
      return apiError(404, "Recipient not found", "NOT_FOUND");
    }

    const created = await prisma.message.create({
      data: {
        senderID: sessionUser.user.userId,
        receiverID: receiverId,
        content: content.value!,
        read: false,
      },
    });

    return NextResponse.json(
      {
        message: "Message sent successfully",
        data: {
          id: created.messageID,
          senderId: created.senderID,
          receiverId: created.receiverID,
          content: created.content,
          createdAt: created.sentAt.toISOString(),
          read: created.read,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Send message error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

