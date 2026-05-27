import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { ollamaGenerate } from "@/lib/ollama";
import { buildSummarizePrompt } from "@/lib/ai/prompts";
import { SummaryResultSchema } from "@/lib/ai/schemas";

/**
 * GET /api/ai/summarize/[postId]
 * Returns an AI-generated summary of the thread + its comments.
 * Requires authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const decoded = await verifyToken(request);
  if (!decoded) return apiError(401, "Not authenticated", "UNAUTHORIZED");

  const { postId } = await params;

  const post = await prisma.post.findUnique({
    where: { postID: postId },
    include: {
      comments: {
        orderBy: { createdAt: "asc" },
        take: 20,
        select: { content: true },
      },
    },
  });

  if (!post) return apiError(404, "Post not found", "NOT_FOUND");

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

    return NextResponse.json(result.data, { status: 200 });
  } catch (err) {
    console.error("[AI summarize] Ollama error:", err);
    return apiError(503, "AI service unavailable", "AI_UNAVAILABLE");
  }
}
