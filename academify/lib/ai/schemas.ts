import { z } from "zod";

export const ModerationResultSchema = z.object({
  decision: z.enum(["approve", "flag", "reject"]),
  toxicity: z.number().min(0).max(1),
  spam: z.number().min(0).max(1),
  labels: z.array(z.string()).default([]),
  reason: z.string().max(300).default(""),
});
export type ModerationResult = z.infer<typeof ModerationResultSchema>;

export const SummaryResultSchema = z.object({
  summary: z.string().max(500),
  keyPoints: z.array(z.string()).default([]),
  openQuestions: z.array(z.string()).default([]),
});
export type SummaryResult = z.infer<typeof SummaryResultSchema>;

export const RecommendResultSchema = z.object({
  recommendations: z.array(
    z.object({
      postID: z.string(),
      score: z.number().min(0).max(1),
      reason: z.string().max(120).default(""),
    })
  ),
});
export type RecommendResult = z.infer<typeof RecommendResultSchema>;

export const ForumRecommendResultSchema = z.object({
  recommendations: z.array(
    z.object({
      forumID: z.string(),
      score: z.number().min(0).max(1),
      reason: z.string().max(120).default(""),
    })
  ),
});
export type ForumRecommendResult = z.infer<typeof ForumRecommendResultSchema>;
