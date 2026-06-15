"use client";

import { useState } from "react";
import { ReportModal } from "@/components/report-modal";
import type { ReportTargetType } from "@/lib/report-reasons";

export function ReportButton({
  targetType,
  targetId,
  targetLabel,
  className = "",
  label,
  stopPropagation = false,
}: {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  className?: string;
  label?: string;
  stopPropagation?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          setOpen(true);
        }}
        className={
          className ||
          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition"
        }
        title="Report"
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        {label ? <span>{label}</span> : null}
      </button>
      {open && (
        <ReportModal
          targetType={targetType}
          targetId={targetId}
          targetLabel={targetLabel}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
