import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { apiError } from "@/lib/api-response";
import { parseJson, parseOptionalString } from "@/lib/validation";

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
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const user = await prisma.user.findUnique({ where: { userId: resolvedUserId } });
    if (!user) {
      return apiError(404, "User not found", "NOT_FOUND");
    }

    const isOwn = sessionData?.user.userId === user.userId;
    return NextResponse.json({ user: { ...mapProfile(user), isOwn } }, { status: 200 });
  } catch (error) {
    console.error("Get user error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

async function updateUserProfile(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const sessionData = await getSession();
    if (!sessionData) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { userId } = await Promise.resolve(params);
    const targetUserId = userId === "me" ? sessionData.user.userId : userId;
    const isOwnerPath = targetUserId === sessionData.user.userId;

    if (!isOwnerPath) {
      return apiError(
        403,
        "Forbidden: you can only update your own profile",
        "FORBIDDEN"
      );
    }

    const body = await parseJson<{ name?: unknown; major?: unknown; bio?: unknown }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const name = parseOptionalString(body.name);
    const major = parseOptionalString(body.major);
    const bio = parseOptionalString(body.bio);
    const errors = [] as Array<{ field?: string; message: string }>;

    if (name.error) errors.push({ field: "name", message: `name ${name.error}` });
    if (major.error) errors.push({ field: "major", message: `major ${major.error}` });
    if (bio.error) errors.push({ field: "bio", message: `bio ${bio.error}` });

    if (errors.length) {
      return apiError(400, "Invalid request", "BAD_REQUEST", errors);
    }

    const updates: { name?: string; major?: string; bio?: string } = {};
    if (name.value !== undefined) updates.name = name.value;
    if (major.value !== undefined) updates.major = major.value;
    if (bio.value !== undefined) updates.bio = bio.value;

    if (Object.keys(updates).length === 0) {
      return apiError(400, "No valid fields to update", "BAD_REQUEST");
    }

    const updated = await prisma.user.update({
      where: { userId: targetUserId },
      data: updates,
    });

    return NextResponse.json(
      { message: "Profile updated successfully", user: { ...mapProfile(updated), isOwn: true } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
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
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { userId } = await Promise.resolve(params);
    const targetUserId = userId === "me" ? sessionData.user.userId : userId;
    const isOwnerPath = targetUserId === sessionData.user.userId;

    if (!isOwnerPath) {
      return apiError(
        403,
        "Forbidden: you can only delete your own account",
        "FORBIDDEN"
      );
    }

    await prisma.user.delete({ where: { userId: targetUserId } });

    return NextResponse.json({ message: "Account deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete user error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
