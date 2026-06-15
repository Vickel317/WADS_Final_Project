"use client";

import { useState } from "react";
import { REPORT_REASONS, reportModalTitle, type ReportTargetType } from "@/lib/report-reasons";

export function ReportModal({
  targetType,
  targetId,
  targetLabel,
  onClose,
}: {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  onClose: () => void;
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError("Please select a reason");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const reasonLabel = REPORT_REASONS.find((r) => r.id === selectedReason)?.label ?? selectedReason;
      const fullReason = description.trim() ? `${reasonLabel}: ${description.trim()}` : reasonLabel;

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: fullReason,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Failed to submit report");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/40 p-3 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="my-auto flex max-h-[min(90dvh,calc(100dvh-1.5rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0 pr-3">
            <h3 className="text-base font-bold text-gray-900">{reportModalTitle(targetType)}</h3>
            <p className="mt-0.5 truncate text-xs text-gray-500">Reporting {targetLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-gray-100"
          >
            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {submitted ? (
            <div className="py-6 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}
              >
                <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-gray-900 mb-1">Report Submitted</h4>
              <p className="text-sm text-gray-500">
                Thank you for helping keep our community safe. We will review your report.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition"
                style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Why are you reporting this? Select the most appropriate reason.
              </p>

              <div className="space-y-2 mb-4">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      selectedReason === reason.id
                        ? "border-teal-300 bg-teal-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={reason.id}
                      checked={selectedReason === reason.id}
                      onChange={() => {
                        setSelectedReason(reason.id);
                        setError(null);
                      }}
                      className="mt-0.5 w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{reason.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{reason.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Additional details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any extra context that might help reviewers..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition resize-none"
                />
              </div>

              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            </>
          )}
        </div>

        {!submitted && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 px-4 py-3 sm:px-5 sm:py-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedReason}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
