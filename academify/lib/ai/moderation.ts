import { ModerationStatus } from "@prisma/client";
import type { ModerationResult } from "@/lib/ai/schemas";

/** AI must report very high risk before a post is auto-blocked. */
export const AI_BLOCK_RISK_THRESHOLD = 0.9;

export function sanitizeAiReason(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return normalized;

  const tokens = normalized.split(" ");
  const compact: string[] = [];
  let prev = "";
  let repeatCount = 0;

  for (const token of tokens) {
    if (token === prev) {
      repeatCount += 1;
      if (repeatCount <= 2) compact.push(token);
      continue;
    }
    prev = token;
    repeatCount = 1;
    compact.push(token);
  }

  return compact.join(" ").slice(0, 320);
}

/**
 * Map AI moderation output to post status.
 * - approve → live
 * - flag → human review
 * - reject → blocked only when risk is very high; otherwise flagged for review
 */
export function mapAiResultToModerationStatus(ai: ModerationResult): {
  status: ModerationStatus;
  aiScore: number;
  aiLabel: string;
  aiReason: string;
} {
  const aiScore = Math.max(ai.toxicity, ai.spam);
  const aiLabel = ai.labels.join(",") || ai.decision;
  const aiReason = sanitizeAiReason(ai.reason);
  const normalizedLabels = ai.labels.map((label) => label.trim().toLowerCase());
  const hasOnlySoftOffTopicSignal =
    normalizedLabels.length > 0 &&
    normalizedLabels.every((label) => label === "off_topic" || label === "safe");

  if (ai.decision === "approve") {
    return {
      status: ModerationStatus.APPROVED,
      aiScore,
      aiLabel,
      aiReason,
    };
  }

  if (ai.decision === "flag") {
    // Keep beginner/generic questions visible when the only concern is low-risk topicality.
    if (hasOnlySoftOffTopicSignal && aiScore < 0.6) {
      return {
        status: ModerationStatus.APPROVED,
        aiScore,
        aiLabel: aiLabel ? `${aiLabel},downgraded_off_topic` : "downgraded_off_topic",
        aiReason: aiReason
          ? `${aiReason} (off-topic-only at low risk; auto-approved)`
          : "Off-topic-only signal at low risk; auto-approved",
      };
    }

    return {
      status: ModerationStatus.FLAGGED,
      aiScore,
      aiLabel,
      aiReason,
    };
  }

  // reject — only auto-block when confidence is very high
  if (aiScore >= AI_BLOCK_RISK_THRESHOLD) {
    return {
      status: ModerationStatus.BLOCKED,
      aiScore,
      aiLabel,
      aiReason,
    };
  }

  return {
    status: ModerationStatus.FLAGGED,
    aiScore,
    aiLabel: aiLabel ? `${aiLabel},downgraded_reject` : "downgraded_reject",
    aiReason: aiReason
      ? `${aiReason} (reject downgraded — risk below block threshold)`
      : "AI reject downgraded to human review (risk below block threshold)",
  };
}
