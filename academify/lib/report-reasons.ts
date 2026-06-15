export const REPORT_REASONS = [
  {
    id: "spam",
    label: "Spam or misleading content",
    description: "Repetitive, unwanted, or deceptive content that misleads others.",
  },
  {
    id: "harassment",
    label: "Harassment or bullying",
    description: "Targeting someone with offensive, threatening, or intimidating behavior.",
  },
  {
    id: "inappropriate",
    label: "Inappropriate content",
    description: "Content that violates community guidelines (nudity, violence, etc.).",
  },
  {
    id: "fake",
    label: "Fake identity or impersonation",
    description: "Pretending to be someone else or using a misleading identity.",
  },
  {
    id: "cheating",
    label: "Academic dishonesty",
    description: "Sharing exam answers, plagiarizing, or facilitating cheating.",
  },
  {
    id: "other",
    label: "Other",
    description: "Something else that violates our community guidelines.",
  },
] as const;

export type { ReportTargetType } from "@/lib/report-target";

export function reportModalTitle(targetType: import("@/lib/report-target").ReportTargetType) {
  if (targetType === "user") return "Report Profile";
  if (targetType === "comment") return "Report Comment";
  if (targetType === "forum") return "Report Forum";
  return "Report Thread";
}
