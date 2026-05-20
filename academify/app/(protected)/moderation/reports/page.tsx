"use client";

import { useEffect, useState } from "react";

type ReportItem = {
	id: string;
	reportedBy: string;
	targetType: string;
	targetId: string;
	reason: string;
	status: string;
	createdAt: string;
};

export default function ModerationReportsPage() {
	const [reports, setReports] = useState<ReportItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [note, setNote] = useState<Record<string, string>>({});

	const loadReports = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/reports");
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
	};

	useEffect(() => {
		void Promise.resolve().then(() => loadReports());
	}, []);

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
				prev.map((report) =>
					report.id === reportId ? { ...report, status: "reviewed" } : report
				)
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
			<div className="rounded-xl border border-gray-200 bg-white p-6">
				<h1 className="text-xl font-semibold text-gray-900">Moderation Reports</h1>
				<p className="mt-2 text-sm text-gray-600">Review and resolve reports.</p>
			</div>

			<div className="rounded-xl border border-gray-200 bg-white p-6">
				{error && <p className="mb-3 text-sm text-red-600">{error}</p>}
				{loading ? (
					<p className="text-sm text-gray-500">Loading reports…</p>
				) : reports.length === 0 ? (
					<p className="text-sm text-gray-500">No reports available.</p>
				) : (
					<div className="space-y-4">
						{reports.map((report) => (
							<div key={report.id} className="rounded-lg border border-gray-100 p-4">
								<div className="flex items-start justify-between">
									<div>
										<p className="text-sm font-semibold text-gray-900">
											{report.targetType} · {report.targetId}
										</p>
										<p className="mt-1 text-xs text-gray-500">
											Reported by {report.reportedBy} · {new Date(report.createdAt).toLocaleString()}
										</p>
									</div>
									<span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
										{report.status}
									</span>
								</div>
								<p className="mt-3 text-sm text-gray-700">{report.reason}</p>
								<div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
									<input
										value={note[report.id] || ""}
										onChange={(e) => setNote((prev) => ({ ...prev, [report.id]: e.target.value }))}
										placeholder="Optional note"
										className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
									/>
									<div className="flex gap-2">
										<button
											onClick={() => review(report.id)}
											className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
										>
											Mark Reviewed
										</button>
										<button
											onClick={() => action(report.id, "resolve")}
											className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
										>
											Resolve
										</button>
										<button
											onClick={() => action(report.id, "dismiss")}
											className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
										>
											Dismiss
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
