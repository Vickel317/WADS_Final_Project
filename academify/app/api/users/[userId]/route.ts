import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { apiError } from "@/lib/api-response";
import { parseJson, parseOptionalString } from "@/lib/validation";
import { deleteObject } from "@/lib/storage";

function mapProfile(user: {
  userId: string;
  email: string;
  name: string;
  role: string;
  major: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  website: string | null;
  academicLevel: string | null;
  skillTags: string[];
  createdAt: Date;
}) {
  const avatarUrl =
    user.avatarUrl && (user.avatarUrl.startsWith("http") || user.avatarUrl.startsWith("data:"))
      ? user.avatarUrl
      : user.avatarUrl
        ? `/api/users/${user.userId}/avatar`
        : null;

  return {
    id: user.userId,
    email: user.email,
    name: user.name,
    role: user.role.toLowerCase(),
    major: user.major ?? "",
    year: user.academicLevel ?? "",
    bio: user.bio ?? "",
    location: user.location ?? "",
    website: user.website ?? "",
    avatarUrl,
    connections: 0,
    posts: 0,
    filesShared: 0,
    skills: user.skillTags ?? [],
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

    const user = await prisma.user.findUnique({ 
      where: { userId: resolvedUserId },
      include: {
        followers: { where: { followerId: sessionData?.user.userId } },
        following: { where: { followingId: sessionData?.user.userId } }
      }
    });
    if (!user) {
      return apiError(404, "User not found", "NOT_FOUND");
    }

    const isOwn = sessionData?.user.userId === user.userId;
    const isFollowing = !isOwn && user.followers.length > 0;
    const isFollower = !isOwn && user.following.length > 0;

    return NextResponse.json({ 
      user: { 
        ...mapProfile({ ...user, role: user.role, avatarUrl: user.avatarUrl }), 
        isOwn,
        isFollowing,
        isFollower,
        isConnected: isFollowing && isFollower
      } 
    }, { status: 200 });
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

    const body = await parseJson<{ name?: unknown; major?: unknown; bio?: unknown; avatarUrl?: unknown }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const name = parseOptionalString(body.name);
    const major = parseOptionalString(body.major);
    const bio = parseOptionalString(body.bio);
    const avatarUrl = parseOptionalString(body.avatarUrl);
    const location = parseOptionalString((body as { location?: unknown }).location);
    const website = parseOptionalString((body as { website?: unknown }).website);
    const year = parseOptionalString((body as { year?: unknown }).year);
    const skillsRaw = (body as { skills?: unknown }).skills;
    const errors = [] as Array<{ field?: string; message: string }>;

    if (name.error) errors.push({ field: "name", message: `name ${name.error}` });
    if (major.error) errors.push({ field: "major", message: `major ${major.error}` });
    if (bio.error) errors.push({ field: "bio", message: `bio ${bio.error}` });
    if (avatarUrl.error) errors.push({ field: "avatarUrl", message: `avatarUrl ${avatarUrl.error}` });
    if (location.error) errors.push({ field: "location", message: `location ${location.error}` });
    if (website.error) errors.push({ field: "website", message: `website ${website.error}` });
    if (year.error) errors.push({ field: "year", message: `year ${year.error}` });
    if (skillsRaw !== undefined && !Array.isArray(skillsRaw)) {
      errors.push({ field: "skills", message: "skills must be an array of strings" });
    }
    if (Array.isArray(skillsRaw) && skillsRaw.some((skill) => typeof skill !== "string")) {
      errors.push({ field: "skills", message: "skills must be an array of strings" });
    }

    if (errors.length) {
      return apiError(400, "Invalid request", "BAD_REQUEST", errors);
    }

    const updates: {
      name?: string;
      major?: string;
      bio?: string;
      avatarUrl?: string | null;
      location?: string | null;
      website?: string | null;
      academicLevel?: string | null;
      skillTags?: string[];
    } = {};
    if (name.value !== undefined) updates.name = name.value;
    if (major.value !== undefined) updates.major = major.value;
    if (bio.value !== undefined) updates.bio = bio.value;
    if (avatarUrl.value !== undefined) updates.avatarUrl = avatarUrl.value || null;
    if (location.value !== undefined) updates.location = location.value || null;
    if (website.value !== undefined) updates.website = website.value || null;
    if (year.value !== undefined) updates.academicLevel = year.value || null;
    if (Array.isArray(skillsRaw)) {
      updates.skillTags = skillsRaw.map((skill) => skill.trim()).filter(Boolean);
    }

    if (Object.keys(updates).length === 0) {
      return apiError(400, "No valid fields to update", "BAD_REQUEST");
    }

    const previousAvatarUrl =
      updates.avatarUrl !== undefined
        ? (await prisma.user.findUnique({
            where: { userId: targetUserId },
            select: { avatarUrl: true },
          }))?.avatarUrl
        : null;

    const updated = await prisma.user.update({
      where: { userId: targetUserId },
      data: updates,
    });

    if (
      updates.avatarUrl !== undefined &&
      previousAvatarUrl &&
      previousAvatarUrl !== updated.avatarUrl &&
      !previousAvatarUrl.startsWith("http") &&
      !previousAvatarUrl.startsWith("/") &&
      !previousAvatarUrl.startsWith("data:")
    ) {
      try {
        await deleteObject(previousAvatarUrl);
      } catch (e) {
        console.warn("Failed to delete previous avatar object:", e);
        // Do not fail the whole profile update if deleting the old object fails
      }
    }

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
