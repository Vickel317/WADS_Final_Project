"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ModerationPage() {
	const [queueCount, setQueueCount] = useState<number | null>(null);
	const [reportCount, setReportCount] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		const load = async () => {
			try {
				const [queueRes, reportsRes] = await Promise.all([
					fetch("/api/moderation/queue"),
					fetch("/api/reports"),
				]);
				const queueData = await queueRes.json().catch(() => ({}));
				const reportData = await reportsRes.json().catch(() => ({}));

				if (!queueRes.ok) {
					throw new Error(queueData?.error?.message || "Failed to load queue");
				}
				if (!reportsRes.ok) {
					throw new Error(reportData?.error?.message || "Failed to load reports");
				}

				if (active) {
					setQueueCount(queueData?.total ?? 0);
					setReportCount(reportData?.reports?.length ?? 0);
				}
			} catch (err) {
				if (active) {
					setError(err instanceof Error ? err.message : "Failed to load moderation data");
				}
			}
		};
		load();
		return () => {
			active = false;
		};
	}, []);

	return (
		<div className="space-y-6">
			<div className="rounded-xl border border-gray-200 bg-white p-6">
				<h1 className="text-xl font-semibold text-gray-900">Moderation</h1>
				<p className="mt-2 text-sm text-gray-600">
					Review queued content and reports.
				</p>
				<div className="mt-4 flex flex-wrap gap-2">
					<Link
						href="/moderation/queue"
						className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
					>
						Open Queue
					</Link>
					<Link
						href="/moderation/reports"
						className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
					>
						Open Reports
					</Link>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div className="rounded-xl border border-gray-200 bg-white p-4">
					<p className="text-xs font-semibold uppercase text-gray-500">Queue</p>
					<p className="mt-2 text-2xl font-semibold text-gray-900">
						{queueCount === null ? "…" : queueCount}
					</p>
				</div>
				<div className="rounded-xl border border-gray-200 bg-white p-4">
					<p className="text-xs font-semibold uppercase text-gray-500">Reports</p>
					<p className="mt-2 text-2xl font-semibold text-gray-900">
						{reportCount === null ? "…" : reportCount}
					</p>
				</div>
			</div>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
					{error}
				</div>
			)}
		</div>
	);
}
