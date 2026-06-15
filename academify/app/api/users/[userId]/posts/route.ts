import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const posts = await prisma.post.findMany({
      where: { authorID: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        postID: true,
        title: true,
        content: true,
        createdAt: true,
        forum: { select: { name: true } },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json({
      data: posts.map((p) => ({
        id: p.postID,
        title: p.title,
        content: p.content.slice(0, 200),
        forum: p.forum.name,
        createdAt: p.createdAt.toISOString(),
        comments: p._count.comments,
      })),
      total: posts.length,
      userId,
    });
  } catch (error) {
    console.error("Get user posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
