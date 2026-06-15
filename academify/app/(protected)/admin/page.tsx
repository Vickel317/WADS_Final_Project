"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AdminAnalytics = {
	users: { total: number; byRole: Record<string, number>; byStatus: Record<string, number> };
	posts: { total: number; totalReplies: number };
	reports: { total: number; byStatus: Record<string, number> };
	moderation: { totalActions: number; byAction: Record<string, number> };
	aiModeration?: Array<{
		id: string;
		title: string;
		status: string;
		aiScore?: number | null;
		aiLabel?: string | null;
		aiReason?: string | null;
		author: string;
		createdAt: string;
	}>;
};

type AdminAnalyticsResponse = {
	analytics: AdminAnalytics;
	warning?: string;
	error?: {
		message?: string;
	};
};

export default function AdminPage() {
	const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [warning, setWarning] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		const load = async () => {
			try {
				const res = await fetch("/api/admin/analytics");
				const data = (await res.json().catch(() => ({}))) as Partial<AdminAnalyticsResponse>;
				if (!res.ok) {
					const message = data?.error?.message || "Failed to load analytics";
					throw new Error(message);
				}
				if (active) {
					setAnalytics(data.analytics || null);
					setWarning(data.warning || null);
				}
			} catch (err) {
				if (active) {
					setError(err instanceof Error ? err.message : "Failed to load analytics");
					setWarning(null);
				}
			} finally {
				if (active) setLoading(false);
			}
		};
		load();
		return () => {
			active = false;
		};
	}, []);

	return (
		<div className="space-y-6">
			<div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
				<div className="p-6 pb-4">
					<h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
					<p className="mt-1 text-sm text-gray-600">
						Platform insights powered by live admin endpoints.
					</p>
				</div>

				<div className="grid grid-cols-2 divide-x divide-y divide-gray-100 border-t border-gray-100 md:grid-cols-4 md:divide-y-0">
					{[
						{ label: "Users", value: analytics?.users.total },
						{ label: "Posts", value: analytics?.posts.total },
						{ label: "Reports", value: analytics?.reports.total },
						{ label: "Moderation", value: analytics?.moderation.totalActions },
					].map((stat) => (
						<div key={stat.label} className="px-5 py-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
								{stat.label}
							</p>
							<p className="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">
								{loading ? "…" : stat.value ?? 0}
							</p>
						</div>
					))}
				</div>

				<div className="flex flex-wrap gap-2 p-4 sm:p-5 bg-gray-50/60">
					<Link
						href="/admin/users"
						className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
					>
						Manage Users
					</Link>
					<Link
						href="/admin/forums"
						className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
					>
						Manage Forums
					</Link>
					<Link
						href="/admin/reports"
						className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
					>
						Manage Reports
					</Link>
					<Link
						href="/moderation/queue"
						className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
					>
						Moderation Queue
					</Link>
				</div>
			</div>

			<div className="rounded-xl border border-gray-200 bg-white p-6">
				<h2 className="text-sm font-semibold text-gray-800">Breakdown</h2>
				{warning && <p className="mt-2 text-sm text-amber-700">{warning}</p>}
				{error && <p className="mt-2 text-sm text-red-600">{error}</p>}
				{!error && !loading && analytics && (
					<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="rounded-lg border border-gray-100 p-4">
							<p className="text-xs font-semibold uppercase text-gray-500">Users By Role</p>
							<ul className="mt-3 space-y-1 text-sm text-gray-700">
								{Object.entries(analytics.users.byRole).map(([role, count]) => (
									<li key={role} className="flex items-center justify-between">
										<span className="capitalize">{role}</span>
										<span className="font-medium">{count}</span>
									</li>
								))}
							</ul>
						</div>
						<div className="rounded-lg border border-gray-100 p-4">
							<p className="text-xs font-semibold uppercase text-gray-500">Reports By Status</p>
							<ul className="mt-3 space-y-1 text-sm text-gray-700">
								{Object.entries(analytics.reports.byStatus).map(([status, count]) => (
									<li key={status} className="flex items-center justify-between">
										<span className="capitalize">{status}</span>
										<span className="font-medium">{count}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				)}
				{!error && loading && (
					<p className="mt-2 text-sm text-gray-500">Loading analytics…</p>
				)}
			</div>

			<div className="rounded-xl border border-gray-200 bg-white p-6">
				<h2 className="text-sm font-semibold text-gray-800">Recent AI Moderation Signals</h2>
				<p className="mt-1 text-xs text-gray-500">
					Shows latest posts with AI label, score, and reason. Approved posts do not appear in moderation queue.
				</p>
				{!loading && analytics && (
					<div className="mt-4 space-y-3">
						{(analytics.aiModeration || []).map((item) => (
							<div key={item.id} className="rounded-lg border border-gray-100 p-3">
								<div className="flex flex-wrap items-center gap-2">
									<p className="text-sm font-medium text-gray-900">{item.title}</p>
									<span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{item.status}</span>
									{item.aiScore != null && (
										<span className="rounded bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
											Risk {Math.round(item.aiScore * 100)}%
										</span>
									)}
									{item.aiLabel && (
										<span className="rounded bg-teal-50 px-2 py-0.5 text-xs text-teal-700">{item.aiLabel}</span>
									)}
								</div>
								<p className="mt-1 text-xs text-gray-500">
									{item.author} · {new Date(item.createdAt).toLocaleString()}
								</p>
								<p className="mt-1 text-xs italic text-gray-600">{item.aiReason || "No AI reason recorded."}</p>
							</div>
						))}
						{(analytics.aiModeration || []).length === 0 && (
							<p className="text-sm text-gray-500">No recent posts found.</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
