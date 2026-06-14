import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { ollamaGenerate } from "@/lib/ollama";
import { buildSummarizePrompt } from "@/lib/ai/prompts";
import { SummaryResultSchema } from "@/lib/ai/schemas";
import { canViewPost } from "@/lib/post-visibility";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";

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

  const post = await prisma.post.findUnique({
    where: { postID: postId },
    include: {
      comments: {
        orderBy: { createdAt: "asc" },
        take: 20,
        select: { content: true },
      },
      _count: { select: { comments: true } },
    },
  });

  if (!post) return apiError(404, "Post not found", "NOT_FOUND");

  if (!canViewPost(post, { id: decoded.id, role: decoded.role })) {
    return apiError(404, "Post not found", "NOT_FOUND");
  }

  const commentCount = post._count.comments;

  if (
    post.summaryJson &&
    post.summaryAt &&
    post.summaryCommentCount === commentCount
  ) {
    const cached = SummaryResultSchema.safeParse(post.summaryJson);
    if (cached.success) {
      return NextResponse.json({ ...cached.data, cached: true }, { status: 200 });
    }
  }

  try {
    const raw = await ollamaGenerate(
      buildSummarizePrompt(
        post.title,
        post.content,
        post.comments.map((c) => c.content)
      )
    );

    const result = SummaryResultSchema.safeParse(raw);

    if (!result.success) {
      console.error("[AI summarize] schema mismatch", raw);
      return apiError(502, "AI response invalid", "AI_ERROR");
    }

    await prisma.post.update({
      where: { postID: postId },
      data: {
        summaryJson: result.data,
        summaryAt: new Date(),
        summaryCommentCount: commentCount,
      },
    });

    return NextResponse.json({ ...result.data, cached: false }, { status: 200 });
  } catch (err) {
    console.error("[AI summarize] Ollama error:", err);
    return apiError(503, "AI service unavailable", "AI_UNAVAILABLE");
  }
}
