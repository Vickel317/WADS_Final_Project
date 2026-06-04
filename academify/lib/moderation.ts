import { ActionType, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appendModerationLog, type ModerationLogEntry } from "@/lib/moderation-log-store";
import { sanitizeText } from "@/lib/sanitization";

export function hasModerationAccess(role?: string | null) {
  const normalized = String(role ?? "").toLowerCase();
  return normalized === "moderator" || normalized === "admin";
}

export function isRestrictedAccount(
  account?: { accountStatus?: UserStatus | string | null; isShadowBanned?: boolean | null } | null
) {
  const status = String(account?.accountStatus ?? "").toUpperCase();
  return status === UserStatus.SUSPENDED || status === UserStatus.BANNED;
}

export function sanitizeModerationReason(reason: string) {
  return sanitizeText(reason).slice(0, 500);
}

function actionTypeToLogAction(actionType: ActionType): ModerationLogEntry["action"] {
  switch (actionType) {
    case ActionType.APPROVE_POST:
      return "approve";
    case ActionType.DELETE_POST:
    case ActionType.DELETE_COMMENT:
      return "delete";
    case ActionType.WARN_USER:
      return "warn";
    case ActionType.SUSPEND_USER:
      return "suspend";
    case ActionType.BAN_USER:
      return "ban";
    default:
      return "report_resolved";
  }
}

export async function recordModerationAction(input: {
  moderatorId: string;
  actionType: ActionType;
  targetUserID?: string | null;
  targetPostID?: string | null;
  targetCommentID?: string | null;
  relatedReportID?: string | null;
  reason: string;
  details?: string | null;
  duration?: number | null;
}) {
  const createdAt = new Date();
  const targetId =
    input.targetUserID ?? input.targetPostID ?? input.targetCommentID ?? input.relatedReportID ?? "unknown";
  const logEntry: ModerationLogEntry = {
    id: `log_${createdAt.getTime()}_${Math.random().toString(16).slice(2, 8)}`,
    action: actionTypeToLogAction(input.actionType),
    targetType: input.targetUserID ? "user" : "post",
    targetId,
    performedBy: input.moderatorId,
    reason: sanitizeModerationReason(input.reason),
    createdAt: createdAt.toISOString(),
  };

  appendModerationLog(logEntry);

  try {
    await prisma.moderationActionLog.create({
      data: {
        modID: input.moderatorId,
        targetUserID: input.targetUserID ?? null,
        targetPostID: input.targetPostID ?? null,
        targetCommentID: input.targetCommentID ?? null,
        relatedReportID: input.relatedReportID ?? null,
        actionType: input.actionType,
        reason: sanitizeModerationReason(input.reason),
        details: input.details ? sanitizeModerationReason(input.details) : null,
        duration: input.duration ?? null,
        timestamp: createdAt,
      },
    });
  } catch (error) {
    console.warn("Failed to persist moderation action log:", error);
  }

  return logEntry;
}
