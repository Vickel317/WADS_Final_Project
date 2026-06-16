import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { getOllamaConfig, ollamaGenerate } from "@/lib/ollama";
import { buildSummarizePrompt } from "@/lib/ai/prompts";
import { SummaryResultSchema } from "@/lib/ai/schemas";
import { canViewPost } from "@/lib/post-visibility";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { topCommentsByLikes } from "@/lib/comment-sort";
import type { SummaryResult } from "@/lib/ai/schemas";

function normalizeSummary(data: SummaryResult): SummaryResult {
  return {
    summary: data.summary.trim(),
    keyPoints: data.keyPoints.map((p) => p.trim()).filter(Boolean),
    openQuestions: data.openQuestions.map((q) => q.trim()).filter(Boolean),
  };
}

/**
 * GET /api/ai/summarize/[postId]
 * Returns an AI-generated summary of the thread + its comments.
 * Requires authentication and the same visibility rules as viewing the post.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const decoded = await verifyToken(request);
  if (!decoded) return apiError(401, "Not authenticated", "UNAUTHORIZED");

  const rate = checkAiRateLimit(decoded.id, "summarize");
  if (!rate.ok) {
    return apiError(429, "Too many summarize requests. Try again shortly.", "RATE_LIMITED");
  }

  const { postId } = await params;
  const refresh = new URL(request.url).searchParams.get("refresh") === "1";

  const post = await prisma.post.findUnique({
    where: { postID: postId },
    include: {
      _count: { select: { comments: true } },
    },
  });

  if (!post) return apiError(404, "Post not found", "NOT_FOUND");

  const commentRows = await prisma.comment.findMany({
    where: { postID: postId },
    select: {
      content: true,
      createdAt: true,
      _count: { select: { likes: true } },
    },
  });

  const topComments = topCommentsByLikes(commentRows, 20);

  if (!canViewPost(post, { id: decoded.id, role: decoded.role })) {
    return apiError(404, "Post not found", "NOT_FOUND");
  }

  const commentCount = post._count.comments;
  const { model } = getOllamaConfig();

  if (
    !refresh &&
    post.summaryJson &&
    post.summaryAt &&
    post.summaryCommentCount === commentCount
  ) {
    const cached = SummaryResultSchema.safeParse(post.summaryJson);
    if (cached.success) {
      return NextResponse.json(
        { ...normalizeSummary(cached.data), model, cached: true, commentCount },
        { status: 200 }
      );
    }
  }

  try {
    const raw = await ollamaGenerate(
      buildSummarizePrompt(
        post.title,
        post.content,
        topComments.map((c) => c.content)
      )
    );

    const result = SummaryResultSchema.safeParse(raw);

    if (!result.success) {
      console.error("[AI summarize] schema mismatch", raw);
      return apiError(502, "AI response invalid", "AI_ERROR");
    }

    const normalized = normalizeSummary(result.data);

    await prisma.post.update({
      where: { postID: postId },
      data: {
        summaryJson: normalized,
        summaryAt: new Date(),
        summaryCommentCount: commentCount,
        updatedAt: post.updatedAt,
      },
    });

    return NextResponse.json(
      { ...normalized, model, cached: false, commentCount },
      { status: 200 }
    );
  } catch (err) {
    console.error("[AI summarize] Ollama error:", err);
    return apiError(503, "AI service unavailable", "AI_UNAVAILABLE");
  }
}
