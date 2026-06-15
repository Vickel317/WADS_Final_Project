import { NextRequest, NextResponse } from "next/server";
import { DMRestriction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { apiError } from "@/lib/api-response";
import { formatEducationLabel, normalizeEducationLevel } from "@/lib/profile-education";
import { parseJson, parseOptionalString } from "@/lib/validation";
import { deleteObject } from "@/lib/storage";
import { resolveAvatarUrl } from "@/lib/avatar-url";

const DM_RESTRICTIONS = new Set<string>(Object.values(DMRestriction));

function mapProfile(
  user: {
    userId: string;
    email: string;
    username: string;
    name: string;
    role: string;
    major: string | null;
    bio: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    location: string | null;
    website: string | null;
    academicLevel: string | null;
    skillTags: string[];
    portfolioLinks: string[];
    department: string | null;
    specializations: string[];
    consultationHours: string | null;
    verifiedPublications: string[];
    askMeAbout: string[];
    createdAt: Date;
    showEmail: boolean;
    showAcademicLevel: boolean;
  },
  counts: { connections: number; posts: number; filesShared: number }
) {
  const avatarUrl = resolveAvatarUrl(user.userId, user.avatarUrl);

  const bannerUrl =
    user.bannerUrl && (user.bannerUrl.startsWith("http") || user.bannerUrl.startsWith("data:"))
      ? user.bannerUrl
      : user.bannerUrl
        ? `/api/users/${user.userId}/banner`
        : null;

  return {
    id: user.userId,
    email: user.showEmail ? user.email : null,
    username: user.username,
    name: user.name,
    role: user.role.toLowerCase(),
    major: user.major ?? "",
    year: user.showAcademicLevel ? formatEducationLabel(user.academicLevel) : "",
    educationLevel: user.showAcademicLevel ? normalizeEducationLevel(user.academicLevel) : "",
    bio: user.bio ?? "",
    location: user.location ?? "",
    website: user.website ?? "",
    avatarUrl,
    bannerUrl,
    connections: counts.connections,
    posts: counts.posts,
    filesShared: counts.filesShared,
    skills: user.skillTags ?? [],
    portfolioLinks: user.portfolioLinks ?? [],
    department: user.department ?? "",
    specializations: user.specializations ?? [],
    consultationHours: user.consultationHours ?? "",
    verifiedPublications: user.verifiedPublications ?? [],
    askMeAbout: user.askMeAbout ?? [],
    createdAt: user.createdAt.toISOString(),
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

    const [connectionsCount, postsCount, filesCount] = await Promise.all([
      prisma.follow.count({
        where: { OR: [{ followerId: resolvedUserId }, { followingId: resolvedUserId }] },
      }),
      prisma.post.count({ where: { authorID: resolvedUserId } }),
      prisma.file.count({ where: { uploadedByID: resolvedUserId } }),
    ]);

    return NextResponse.json({
      user: {
        ...mapProfile(
          { ...user, role: user.role, avatarUrl: user.avatarUrl },
          { connections: connectionsCount, posts: postsCount, filesShared: filesCount }
        ),
        isOwn,
        isFollowing,
        isFollower,
        isConnected: isFollowing && isFollower,
        ...(isOwn
          ? {
              showEmail: user.showEmail,
              showAcademicLevel: user.showAcademicLevel,
              showLastSeen: user.showLastSeen,
              dmRestriction: user.dmRestriction,
            }
          : {}),
      },
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
    const year = parseOptionalString(
      (body as { year?: unknown; educationLevel?: unknown }).year ??
        (body as { educationLevel?: unknown }).educationLevel
    );
    const skillsRaw = (body as { skills?: unknown }).skills;
    const department = parseOptionalString((body as { department?: unknown }).department);
    const consultationHours = parseOptionalString(
      (body as { consultationHours?: unknown }).consultationHours
    );
    const specializationsRaw = (body as { specializations?: unknown }).specializations;
    const verifiedPublicationsRaw = (body as { verifiedPublications?: unknown }).verifiedPublications;
    const askMeAboutRaw = (body as { askMeAbout?: unknown }).askMeAbout;
    const showEmailRaw = (body as { showEmail?: unknown }).showEmail;
    const showAcademicLevelRaw = (body as { showAcademicLevel?: unknown }).showAcademicLevel;
    const showLastSeenRaw = (body as { showLastSeen?: unknown }).showLastSeen;
    const dmRestrictionRaw = (body as { dmRestriction?: unknown }).dmRestriction;
    const errors = [] as Array<{ field?: string; message: string }>;

    if (name.error) errors.push({ field: "name", message: `name ${name.error}` });
    if (major.error) errors.push({ field: "major", message: `major ${major.error}` });
    if (bio.error) errors.push({ field: "bio", message: `bio ${bio.error}` });
    if (avatarUrl.error) errors.push({ field: "avatarUrl", message: `avatarUrl ${avatarUrl.error}` });
    if (location.error) errors.push({ field: "location", message: `location ${location.error}` });
    if (website.error) errors.push({ field: "website", message: `website ${website.error}` });
    if (year.error) errors.push({ field: "educationLevel", message: `educationLevel ${year.error}` });
    if (department.error) errors.push({ field: "department", message: `department ${department.error}` });
    if (consultationHours.error) {
      errors.push({ field: "consultationHours", message: `consultationHours ${consultationHours.error}` });
    }
    if (skillsRaw !== undefined && !Array.isArray(skillsRaw)) {
      errors.push({ field: "skills", message: "skills must be an array of strings" });
    }
    if (Array.isArray(skillsRaw) && skillsRaw.some((skill) => typeof skill !== "string")) {
      errors.push({ field: "skills", message: "skills must be an array of strings" });
    }
    for (const [field, value] of [
      ["specializations", specializationsRaw],
      ["verifiedPublications", verifiedPublicationsRaw],
      ["askMeAbout", askMeAboutRaw],
    ] as const) {
      if (value !== undefined && !Array.isArray(value)) {
        errors.push({ field, message: `${field} must be an array of strings` });
      }
      if (Array.isArray(value) && value.some((item) => typeof item !== "string")) {
        errors.push({ field, message: `${field} must be an array of strings` });
      }
    }

    if (showEmailRaw !== undefined && typeof showEmailRaw !== "boolean") {
      errors.push({ field: "showEmail", message: "showEmail must be a boolean" });
    }
    if (showAcademicLevelRaw !== undefined && typeof showAcademicLevelRaw !== "boolean") {
      errors.push({ field: "showAcademicLevel", message: "showAcademicLevel must be a boolean" });
    }
    if (showLastSeenRaw !== undefined && typeof showLastSeenRaw !== "boolean") {
      errors.push({ field: "showLastSeen", message: "showLastSeen must be a boolean" });
    }
    if (
      dmRestrictionRaw !== undefined &&
      (typeof dmRestrictionRaw !== "string" || !DM_RESTRICTIONS.has(dmRestrictionRaw))
    ) {
      errors.push({ field: "dmRestriction", message: "dmRestriction must be ALL, CONNECTIONS, LECTURERS, or NONE" });
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
      department?: string | null;
      consultationHours?: string | null;
      specializations?: string[];
      verifiedPublications?: string[];
      askMeAbout?: string[];
      showEmail?: boolean;
      showAcademicLevel?: boolean;
      showLastSeen?: boolean;
      dmRestriction?: DMRestriction;
    } = {};
    if (name.value !== undefined) updates.name = name.value;
    if (major.value !== undefined) updates.major = major.value;
    if (bio.value !== undefined) updates.bio = bio.value;
    if (avatarUrl.value !== undefined) updates.avatarUrl = avatarUrl.value || null;
    if (location.value !== undefined) updates.location = location.value || null;
    if (website.value !== undefined) updates.website = website.value || null;
    if (year.value !== undefined) {
      updates.academicLevel =
        year.value && year.value !== "Prefer not to say"
          ? normalizeEducationLevel(year.value)
          : null;
    }
    if (Array.isArray(skillsRaw)) {
      updates.skillTags = skillsRaw.map((skill) => skill.trim()).filter(Boolean);
    }
    if (department.value !== undefined) updates.department = department.value || null;
    if (consultationHours.value !== undefined) {
      updates.consultationHours = consultationHours.value || null;
    }
    if (Array.isArray(specializationsRaw)) {
      updates.specializations = specializationsRaw.map((item) => item.trim()).filter(Boolean);
    }
    if (Array.isArray(verifiedPublicationsRaw)) {
      updates.verifiedPublications = verifiedPublicationsRaw.map((item) => item.trim()).filter(Boolean);
    }
    if (Array.isArray(askMeAboutRaw)) {
      updates.askMeAbout = askMeAboutRaw.map((item) => item.trim()).filter(Boolean);
    }
    if (typeof showEmailRaw === "boolean") updates.showEmail = showEmailRaw;
    if (typeof showAcademicLevelRaw === "boolean") updates.showAcademicLevel = showAcademicLevelRaw;
    if (typeof showLastSeenRaw === "boolean") updates.showLastSeen = showLastSeenRaw;
    if (typeof dmRestrictionRaw === "string" && DM_RESTRICTIONS.has(dmRestrictionRaw)) {
      updates.dmRestriction = dmRestrictionRaw as DMRestriction;
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
      { message: "Profile updated successfully", user: { ...mapProfile(updated, { connections: 0, posts: 0, filesShared: 0 }), isOwn: true } },
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
