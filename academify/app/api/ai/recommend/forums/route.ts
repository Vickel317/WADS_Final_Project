import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { ollamaGenerate } from "@/lib/ollama";
import { buildForumRecommendPrompt } from "@/lib/ai/prompts";
import { ForumRecommendResultSchema } from "@/lib/ai/schemas";
import { getRecommendUserContext } from "@/lib/ai/recommend-context";
import {
  RECOMMEND_AI_TIMEOUT_MS,
  scoreForumHeuristic,
} from "@/lib/ai/recommend-heuristics";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { slugify } from "@/lib/slugify";
import { getPresignedGetUrl } from "@/lib/storage";

/**
 * GET /api/ai/recommend/forums
 * Returns forum recommendations based on profile and posting activity.
 */
export async function GET(request: NextRequest) {
  const decoded = await verifyToken(request);
  if (!decoded) return apiError(401, "Not authenticated", "UNAUTHORIZED");

  const context = await getRecommendUserContext(decoded.id);
  const joinedSet = new Set(context.joinedForumIds);
  const heuristicOnly = new URL(request.url).searchParams.get("heuristic") === "1";

  const forums = await prisma.forumHub.findMany({
    where: {
      forumID: { notIn: context.joinedForumIds },
    },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: {
      forumID: true,
      name: true,
      description: true,
      imageUrl: true,
    },
  });

  if (forums.length === 0) {
    return NextResponse.json({ recommendations: [] }, { status: 200 });
  }

  const enrichForum = async (
    forum: (typeof forums)[number],
    score: number,
    reason: string
  ) => {
    let imageUrl = forum.imageUrl ?? null;
    if (
      imageUrl &&
      !imageUrl.startsWith("http") &&
      !imageUrl.startsWith("data:") &&
      !imageUrl.startsWith("/")
    ) {
      try {
        imageUrl = await getPresignedGetUrl(imageUrl);
      } catch {
        imageUrl = forum.imageUrl ?? null;
      }
    }

    return {
      forumID: forum.forumID,
      slug: slugify(forum.name),
      name: forum.name,
      description: forum.description ?? "",
      imageUrl,
      score,
      reason,
    };
  };

  const buildFallback = () =>
    Promise.all(
      forums
        .map((forum) => ({
          forum,
          ...scoreForumHeuristic(forum, context.profile),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(({ forum, score, reason }) => enrichForum(forum, score, reason))
    );

  if (heuristicOnly) {
    return NextResponse.json(
      { recommendations: await buildFallback(), fallback: true },
      { status: 200 }
    );
  }

  const rate = checkAiRateLimit(decoded.id, "recommend-forums");
  if (!rate.ok) {
    return NextResponse.json(
      { recommendations: await buildFallback(), fallback: true },
      { status: 200 }
    );
  }

  try {
    const raw = await ollamaGenerate(
      buildForumRecommendPrompt(
        context.profile,
        context.joinedForumNames,
        forums.map((forum) => ({
          forumID: forum.forumID,
          name: forum.name,
          description: forum.description ?? "",
        }))
      ),
      { timeoutMs: RECOMMEND_AI_TIMEOUT_MS, maxRetries: 0 }
    );

    const result = ForumRecommendResultSchema.safeParse(raw);
    if (!result.success) {
      console.error("[AI recommend forums] schema mismatch", raw);
      return NextResponse.json(
        { recommendations: await buildFallback(), fallback: true },
        { status: 200 }
      );
    }

    const forumMap = new Map(forums.map((forum) => [forum.forumID, forum]));
    const enriched = await Promise.all(
      result.data.recommendations
        .filter((entry) => forumMap.has(entry.forumID) && !joinedSet.has(entry.forumID))
        .slice(0, 4)
        .map((entry) => enrichForum(forumMap.get(entry.forumID)!, entry.score, entry.reason))
    );

    if (enriched.length === 0) {
      return NextResponse.json(
        { recommendations: await buildFallback(), fallback: true },
        { status: 200 }
      );
    }

    return NextResponse.json({ recommendations: enriched }, { status: 200 });
  } catch (err) {
    console.error("[AI recommend forums] Ollama error, using heuristics:", err);
    return NextResponse.json(
      { recommendations: await buildFallback(), fallback: true },
      { status: 200 }
    );
  }
}
