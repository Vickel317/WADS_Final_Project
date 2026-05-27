import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { ollamaGenerate } from "@/lib/ollama";
import { buildRecommendPrompt } from "@/lib/ai/prompts";
import { RecommendResultSchema } from "@/lib/ai/schemas";
import { ModerationStatus } from "@prisma/client";

/**
 * GET /api/ai/recommend
 * Returns up to 5 thread recommendations based on the user's profile and forums.
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  const decoded = await verifyToken(request);
  if (!decoded) return apiError(401, "Not authenticated", "UNAUTHORIZED");

  const user = await prisma.user.findUnique({
    where: { userId: decoded.id },
    select: { major: true, bio: true, skillTags: true },
  });

  const userForums = await prisma.post.findMany({
    where: { authorID: decoded.id },
    select: { forum: { select: { name: true } } },
    distinct: ["forumID"],
    take: 8,
  });
  const forumNames = userForums.map((p) => p.forum.name);

  const threads = await prisma.post.findMany({
    where: {
      moderationStatus: ModerationStatus.APPROVED,
      authorID: { not: decoded.id },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      postID: true,
      title: true,
      forum: { select: { name: true } },
    },
  });

  if (threads.length === 0) {
    return NextResponse.json({ recommendations: [] }, { status: 200 });
  }

  try {
    const raw = await ollamaGenerate(
      buildRecommendPrompt(
        { major: user?.major, bio: user?.bio },
        forumNames,
        threads.map((t) => ({ postID: t.postID, title: t.title, forum: t.forum.name }))
      )
    );

    const result = RecommendResultSchema.safeParse(raw);
    if (!result.success) {
      console.error("[AI recommend] schema mismatch", raw);
      return apiError(502, "AI response invalid", "AI_ERROR");
    }

    // Enrich with post title + forum for the frontend
    const postMap = new Map(threads.map((t) => [t.postID, t]));
    const enriched = result.data.recommendations
      .filter((r) => postMap.has(r.postID))
      .map((r) => {
        const post = postMap.get(r.postID)!;
        return { ...r, title: post.title, forum: post.forum.name };
      });

    return NextResponse.json({ recommendations: enriched }, { status: 200 });
  } catch (err) {
    console.error("[AI recommend] Ollama error:", err);
    return apiError(503, "AI service unavailable", "AI_UNAVAILABLE");
  }
}
