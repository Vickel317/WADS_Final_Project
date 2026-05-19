import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const sessionData = await getSession();
    if (!sessionData) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { userId } = sessionData.user;

    // Get following
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            userId: true,
            name: true,
            username: true,
            major: true,
            followers: { where: { followerId: userId } },
            following: { where: { followingId: userId } }
          }
        }
      }
    });

    // Get followers
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            userId: true,
            name: true,
            username: true,
            major: true,
            followers: { where: { followerId: userId } },
            following: { where: { followingId: userId } }
          }
        }
      }
    });

    // Map users and connection status
    const mapUser = (u: any) => ({
      userId: u.userId,
      name: u.name,
      username: u.username,
      major: u.major,
      isFollowing: u.followers.length > 0,
      isFollower: u.following.length > 0,
      isConnected: u.followers.length > 0 && u.following.length > 0
    });

    return NextResponse.json({
      following: following.map(f => mapUser(f.following)),
      followers: followers.map(f => mapUser(f.follower))
    }, { status: 200 });

  } catch (error) {
    console.error("Connections API error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
