import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { ollamaGenerate } from "@/lib/ollama";
import { buildRecommendPrompt } from "@/lib/ai/prompts";
import { RecommendResultSchema } from "@/lib/ai/schemas";
import { ModerationStatus } from "@prisma/client";
import { getRecommendUserContext } from "@/lib/ai/recommend-context";
import {
  buildThreadHeuristicRecommendations,
  RECOMMEND_AI_TIMEOUT_MS,
} from "@/lib/ai/recommend-heuristics";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";

/**
 * GET /api/ai/recommend
 * Returns paginated thread recommendations based on profile, skills, and forum activity.
 */
export async function GET(request: NextRequest) {
  const decoded = await verifyToken(request);
  if (!decoded) return apiError(401, "Not authenticated", "UNAUTHORIZED");

  const rate = checkAiRateLimit(decoded.id, "recommend");
  if (!rate.ok) {
    return apiError(429, "Too many recommendation requests. Try again shortly.", "RATE_LIMITED");
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(8, Math.max(1, Number.parseInt(searchParams.get("limit") || "5", 10) || 5));
  const heuristicOnly = searchParams.get("heuristic") === "1";
  const candidateTake = 25;
  const skip = (page - 1) * candidateTake;

  const context = await getRecommendUserContext(decoded.id);

  const threads = await prisma.post.findMany({
    where: {
      moderationStatus: ModerationStatus.APPROVED,
      authorID: { not: decoded.id },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: candidateTake,
    select: {
      postID: true,
      title: true,
      forum: { select: { name: true } },
    },
  });

  const hasMore = skip + threads.length < 200 && threads.length === candidateTake;

  if (threads.length === 0) {
    return NextResponse.json(
      { recommendations: [], page, limit, hasMore: false },
      { status: 200 }
    );
  }

  const threadRows = threads.map((t) => ({
    postID: t.postID,
    title: t.title,
    forum: t.forum.name,
  }));

  const fallback = buildThreadHeuristicRecommendations(threadRows, context, limit);

  if (heuristicOnly) {
    return NextResponse.json(
      { recommendations: fallback, page, limit, hasMore, fallback: true },
      { status: 200 }
    );
  }

  try {
    const raw = await ollamaGenerate(
      buildRecommendPrompt(context.profile, context.joinedForumNames, threadRows),
      { timeoutMs: RECOMMEND_AI_TIMEOUT_MS, maxRetries: 0 }
    );

    const result = RecommendResultSchema.safeParse(raw);
    if (!result.success) {
      console.error("[AI recommend] schema mismatch", raw);
      return NextResponse.json(
        { recommendations: fallback, page, limit, hasMore, fallback: true },
        { status: 200 }
      );
    }

    const postMap = new Map(threadRows.map((t) => [t.postID, t]));
    const enriched = result.data.recommendations
      .filter((r) => postMap.has(r.postID))
      .slice(0, limit)
      .map((r) => {
        const post = postMap.get(r.postID)!;
        return { ...r, title: post.title, forum: post.forum };
      });

    if (enriched.length === 0) {
      return NextResponse.json(
        { recommendations: fallback, page, limit, hasMore, fallback: true },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { recommendations: enriched, page, limit, hasMore },
      { status: 200 }
    );
  } catch (err) {
    console.error("[AI recommend] Ollama error, using heuristics:", err);
    return NextResponse.json(
      { recommendations: fallback, page, limit, hasMore, fallback: true },
      { status: 200 }
    );
  }
}
