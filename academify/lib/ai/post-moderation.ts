import { ModerationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ollamaGenerate } from "@/lib/ollama";
import { buildModerationPrompt } from "@/lib/ai/prompts";
import { ModerationResultSchema } from "@/lib/ai/schemas";
import { mapAiResultToModerationStatus } from "@/lib/ai/moderation";
import { buildProfanityModerationResult } from "@/lib/ai/profanity";

const POST_MODERATION_TIMEOUT_MS = Number(process.env.OLLAMA_POST_TIMEOUT_MS ?? 15000);

export type PostModerationFields = {
  status: ModerationStatus;
  aiScore: number | null;
  aiLabel: string | null;
  aiReason: string | null;
};

export async function runPostModeration(
  title: string,
  content: string,
  forumName: string
): Promise<PostModerationFields> {
  let aiStatus: ModerationStatus = ModerationStatus.PENDING;
  let aiScore: number | null = null;
  let aiLabel: string | null = null;
  let aiReason: string | null = null;

  try {
    const raw = await ollamaGenerate(buildModerationPrompt(title, content, forumName), {
      timeoutMs: POST_MODERATION_TIMEOUT_MS,
      maxRetries: 0,
    });
    const ai = ModerationResultSchema.safeParse(raw);
    if (ai.success) {
      const mapped = mapAiResultToModerationStatus(ai.data);
      aiStatus = mapped.status;
      aiScore = mapped.aiScore;
      aiLabel = mapped.aiLabel;
      aiReason = mapped.aiReason;
    } else {
      aiLabel = "ai_parse_error";
      aiReason = "AI moderation output invalid; sent to human review";
      aiStatus = ModerationStatus.PENDING;
    }
  } catch {
    const fallback = buildProfanityModerationResult(`${title} ${content}`);
    if (fallback) {
      const mapped = mapAiResultToModerationStatus(fallback);
      aiStatus = mapped.status;
      aiScore = mapped.aiScore;
      aiLabel = mapped.aiLabel;
      aiReason = mapped.aiReason;
    } else {
      aiLabel = "ai_unavailable";
      aiReason = "AI moderation unavailable; sent to human review";
    }
  }

  return { status: aiStatus, aiScore, aiLabel, aiReason };
}

/** @deprecated Use runPostModeration */
export const resolvePostModeration = runPostModeration;

export async function applyPostModeration(
  postId: string,
  title: string,
  content: string,
  forumName: string
) {
  try {
    const existing = await prisma.post.findUnique({
      where: { postID: postId },
      select: { updatedAt: true },
    });
    if (!existing) return;

    const result = await runPostModeration(title, content, forumName);
    await prisma.post.update({
      where: { postID: postId },
      data: {
        moderationStatus: result.status,
        aiScore: result.aiScore,
        aiLabel: result.aiLabel,
        aiReason: result.aiReason,
        summaryJson: Prisma.DbNull,
        summaryAt: null,
        summaryCommentCount: null,
        updatedAt: existing.updatedAt,
      },
    });
  } catch (error) {
    console.error(`[moderation] Failed to update post ${postId}:`, error);
  }
}
