import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) return apiError(401, "Not authenticated", "UNAUTHORIZED");

    const { fileId } = await params;
    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    if (!body || !body.email) return apiError(400, "Missing email", "BAD_REQUEST");

    const file = await prisma.file.findUnique({ where: { fileID: fileId } });
    if (!file) return apiError(404, "File not found", "NOT_FOUND");

    if (file.uploadedByID !== decoded.id) {
      return apiError(403, "Forbidden: You can only share your own files", "FORBIDDEN");
    }

    // Find recipient user by email
    const recipient = await prisma.user.findUnique({ where: { email: body.email } });
    if (!recipient) {
      return apiError(404, "Recipient not found", "NOT_FOUND");
    }

    // Create a message to notify recipient with a link to the file
    const content = `Shared file: ${file.fileName}\n${file.fileUrl}`;
    await prisma.message.create({ data: { senderID: decoded.id, receiverID: recipient.userId, content } });

    return NextResponse.json({ message: "File shared via message/email (notification created)" }, { status: 200 });
  } catch (error) {
    console.error("Share file by email error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
