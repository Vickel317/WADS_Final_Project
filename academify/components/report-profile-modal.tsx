"use client";

import { useState } from "react";

const REPORT_REASONS = [
  { id: "spam", label: "Spam or misleading content", description: "Repetitive, unwanted, or deceptive content that misleads others." },
  { id: "harassment", label: "Harassment or bullying", description: "Targeting someone with offensive, threatening, or intimidating behavior." },
  { id: "inappropriate", label: "Inappropriate content", description: "Profile content that violates community guidelines (nudity, violence, etc.)." },
  { id: "fake", label: "Fake identity or impersonation", description: "Pretending to be someone else or using a misleading identity." },
  { id: "cheating", label: "Academic dishonesty", description: "Sharing exam answers, plagiarizing, or facilitating cheating." },
  { id: "other", label: "Other", description: "Something else that violates our community guidelines." },
];

export function ReportProfileModal({
  userId,
  userName,
  onClose,
}: {
  userId: string;
  userName: string;
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
      const fullReason = description.trim()
        ? `${reasonLabel}: ${description.trim()}`
        : reasonLabel;

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "user",
          targetId: userId,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Report Profile</h3>
            <p className="text-xs text-gray-500 mt-0.5">Reporting {userName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
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
              <p className="text-sm text-gray-500">Thank you for helping keep our community safe. We will review your report.</p>
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
                Why are you reporting this profile? Select the most appropriate reason.
              </p>

              {/* Reasons list */}
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
                      onChange={() => { setSelectedReason(reason.id); setError(null); }}
                      className="mt-0.5 w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{reason.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{reason.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Description */}
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

              {error && (
                <p className="mt-2 text-xs text-red-500">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
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
