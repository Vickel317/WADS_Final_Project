export type ModerationLogEntry = {
  id: string;
  action:
    | "approve"
    | "delete"
    | "warn"
    | "suspend"
    | "ban"
    | "report_resolved"
    | "report_dismissed";
  targetType: "post" | "user";
  targetId: string;
  performedBy: string;
  reason?: string;
  createdAt: string;
};

export const moderationLogs: ModerationLogEntry[] = [];

export function appendModerationLog(entry: ModerationLogEntry) {
  moderationLogs.push(entry);
}

export function getRecentModerationLogs(limit: number) {
  return moderationLogs.slice(-limit).reverse();
}
