"use client";

import { ReportModal } from "@/components/report-modal";

export function ReportProfileModal({
  userId,
  userName,
  onClose,
}: {
  userId: string;
  userName: string;
  onClose: () => void;
}) {
  return (
    <ReportModal targetType="user" targetId={userId} targetLabel={userName} onClose={onClose} />
  );
}
