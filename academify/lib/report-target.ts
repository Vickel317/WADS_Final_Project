export type ReportTargetType = "post" | "comment" | "user" | "forum";

export function resolveReportTarget(report: {
  reportedPostID: string | null;
  reportedCommentID: string | null;
  reportedUserID: string | null;
  reportedForumID?: string | null;
}) {
  if (report.reportedForumID) {
    return { targetType: "forum" as const, targetId: report.reportedForumID };
  }
  if (report.reportedPostID) {
    return { targetType: "post" as const, targetId: report.reportedPostID };
  }
  if (report.reportedCommentID) {
    return { targetType: "comment" as const, targetId: report.reportedCommentID };
  }
  if (report.reportedUserID) {
    return { targetType: "user" as const, targetId: report.reportedUserID };
  }
  return { targetType: "post" as const, targetId: "" };
}
