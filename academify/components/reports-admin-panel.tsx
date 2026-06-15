"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminBackLink } from "@/components/admin-back-link";

type ReportItem = {
  id: string;
  reportedBy: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
};

const STATUS_FILTERS = ["all", "pending", "reviewed", "resolved", "dismissed"] as const;

function statusBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "reviewed":
      return "bg-blue-50 text-blue-700";
    case "resolved":
      return "bg-green-50 text-green-700";
    case "dismissed":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function targetHref(targetType: string, targetId: string) {
  if (targetType === "user") return `/profile/${targetId}`;
  if (targetType === "post") return `/post/${targetId}`;
  return null;
}

export function ReportsAdminPanel({
  title = "Reports",
  backHref = "/admin",
}: {
  title?: string;
  backHref?: string;
}) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter === "all" ? "" : `?status=${statusFilter}`;
      const res = await fetch(`/api/reports${query}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to load reports");
      }
      setReports(data.reports || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const review = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: note[reportId] || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to mark reviewed");
      }
      setReports((prev) =>
        prev.map((report) => (report.id === reportId ? { ...report, status: "reviewed" } : report))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark reviewed");
    }
  };

  const action = async (reportId: string, actionType: "resolve" | "dismiss") => {
    try {
      const res = await fetch(`/api/reports/${reportId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, note: note[reportId] || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to update report");
      }
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? { ...report, status: actionType === "resolve" ? "resolved" : "dismissed" }
            : report
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update report");
    }
  };

  return (
    <div className="space-y-6">
      <AdminBackLink href={backHref} />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review community reports for profiles, threads, and comments.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                statusFilter === status
                  ? "bg-teal-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-500">Loading reports…</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-gray-500">No reports in this filter.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const href = targetHref(report.targetType, report.targetId);
              return (
                <div key={report.id} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {report.targetType}
                        {href ? (
                          <>
                            {" · "}
                            <Link href={href} className="text-teal-600 hover:underline">
                              View content
                            </Link>
                          </>
                        ) : (
                          <> · {report.targetId}</>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Reported by {report.reportedBy} · {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusBadgeClass(report.status)}`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-700">{report.reason}</p>
                  <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <input
                      value={note[report.id] || ""}
                      onChange={(e) => setNote((prev) => ({ ...prev, [report.id]: e.target.value }))}
                      placeholder="Optional review note"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                      {report.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => review(report.id)}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Mark Reviewed
                        </button>
                      )}
                      {report.status !== "resolved" && report.status !== "dismissed" && (
                        <>
                          <button
                            type="button"
                            onClick={() => action(report.id, "resolve")}
                            className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
                          >
                            Resolve
                          </button>
                          <button
                            type="button"
                            onClick={() => action(report.id, "dismiss")}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
