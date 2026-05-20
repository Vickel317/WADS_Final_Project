import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { apiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const sessionData = await getSession();
    if (!sessionData) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "20");

    const whereClause: any = {
      NOT: {
        userId: sessionData.user.userId, // Exclude current user from search
      },
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      take: limit,
      select: {
        userId: true,
        name: true,
        username: true,
        major: true,
        bio: true,
        academicLevel: true,
        followers: {
          where: { followerId: sessionData.user.userId }
        },
        following: {
          where: { followingId: sessionData.user.userId }
        }
      },
    });

    // Map output and calculate if they are connected
    const mappedUsers = users.map(user => {
      const isFollowing = user.followers.length > 0;
      const isFollower = user.following.length > 0;
      return {
        userId: user.userId,
        name: user.name,
        username: user.username,
        major: user.major,
        bio: user.bio,
        academicLevel: user.academicLevel,
        isFollowing,
        isFollower,
        isConnected: isFollowing && isFollower
      };
    });

    return NextResponse.json({ users: mappedUsers }, { status: 200 });
  } catch (error) {
    console.error("Search users error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
