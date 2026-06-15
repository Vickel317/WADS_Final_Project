import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { apiError } from "@/lib/api-response";
import { normalizeEducationLevel } from "@/lib/profile-education";

export async function POST(request: NextRequest) {
  try {
    const sessionData = await getSession();
    if (!sessionData) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const body = await request.json();

    const {
      role,
      academicLevel,
      educationLevel,
      major,
      bio,
      skillTags,
      portfolioLinks,
      department,
      specializations,
      consultationHours,
      verifiedPublications,
      askMeAbout,
      username,
    } = body;

    const resolvedEducation = normalizeEducationLevel(
      typeof educationLevel === "string" ? educationLevel : academicLevel
    );

    const updates: Prisma.UserUpdateInput = {
      profileSetupComplete: true,
      bio: bio || null,
      username: username || sessionData.user.username,
    };

    if (role === "STUDENT") {
      updates.role = "STUDENT";
      updates.academicLevel =
        resolvedEducation === "Prefer not to say" ? null : resolvedEducation;
      updates.major = typeof major === "string" && major.trim() ? major.trim() : null;
      updates.skillTags = skillTags || [];
      updates.portfolioLinks = portfolioLinks || [];
    } else if (role === "LECTURER") {
      updates.role = "LECTURER";
      updates.department = department || null;
      updates.specializations = specializations || [];
      updates.consultationHours = consultationHours || null;
      updates.verifiedPublications = verifiedPublications || [];
      updates.askMeAbout = askMeAbout || [];
    }

    const updatedUser = await prisma.user.update({
      where: { userId: sessionData.user.userId },
      data: updates,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Profile setup error:", error);
    return apiError(500, "Internal Server Error", "INTERNAL_ERROR");
  }
}
