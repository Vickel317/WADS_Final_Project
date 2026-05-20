import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { handleApiError } from "@/lib/error-handler";
import { validateProfileUpdatePayload } from "@/lib/security";

function mapProfile(user: {
  userId: string;
  email: string;
  name: string;
  role: string;
  major: string | null;
  bio: string | null;
  createdAt: Date;
}) {
  return {
    id: user.userId,
    email: user.email,
    name: user.name,
    role: user.role.toLowerCase(),
    major: user.major ?? "",
    year: "",
    bio: user.bio ?? "",
    location: "",
    website: "",
    connections: 0,
    posts: 0,
    filesShared: 0,
    skills: [] as string[],
    isConnected: false,
    createdAt: user.createdAt.toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const { userId } = await Promise.resolve(params);
    const sessionData = await getSession();

    const resolvedUserId = userId === "me" ? sessionData?.user.userId : userId;
    if (!resolvedUserId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { userId: resolvedUserId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOwn = sessionData?.user.userId === user.userId;
    return NextResponse.json({ user: { ...mapProfile(user), isOwn } }, { status: 200 });
  } catch (error) {
    return handleApiError("Get user error:", error);
  }
}

async function updateUserProfile(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const sessionData = await getSession();
    if (!sessionData) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userId } = await Promise.resolve(params);
    const targetUserId = userId === "me" ? sessionData.user.userId : userId;
    const isOwnerPath = targetUserId === sessionData.user.userId;

    if (!isOwnerPath) {
      return NextResponse.json(
        { error: "Forbidden: you can only update your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = validateProfileUpdatePayload(body);
    if (!validationResult.ok) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    const updates = validationResult.data;

    const updated = await prisma.user.update({
      where: { userId: targetUserId },
      data: updates,
    });

    return NextResponse.json(
      { message: "Profile updated successfully", user: { ...mapProfile(updated), isOwn: true } },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError("Update user error:", error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> | { userId: string } }
) {
  return updateUserProfile(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> | { userId: string } }
) {
  return updateUserProfile(request, context);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const sessionData = await getSession();
    if (!sessionData) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userId } = await Promise.resolve(params);
    const targetUserId = userId === "me" ? sessionData.user.userId : userId;
    const isOwnerPath = targetUserId === sessionData.user.userId;

    if (!isOwnerPath) {
      return NextResponse.json(
        { error: "Forbidden: you can only delete your own account" },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { userId: targetUserId } });

    return NextResponse.json({ message: "Account deleted successfully" }, { status: 200 });
  } catch (error) {
    return handleApiError("Delete user error:", error);
  }
}
