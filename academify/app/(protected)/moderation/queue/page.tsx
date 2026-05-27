"use client";

import { useEffect, useState } from "react";

type QueueItem = {
	id: string;
	title: string;
	content: string;
	forum: string;
	author: string;
	replyCount: number;
	createdAt: string;
	status: string;
	aiScore?: number | null;
	aiLabel?: string | null;
	aiReason?: string | null;
};

export default function ModerationQueuePage() {
	const [queue, setQueue] = useState<QueueItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reason, setReason] = useState<Record<string, string>>({});

	const loadQueue = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/moderation/queue");
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data?.error?.message || "Failed to load queue");
			}
			setQueue(data.queue || []);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load queue");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void Promise.resolve().then(() => loadQueue());
	}, []);

	const approve = async (postId: string) => {
		try {
			const res = await fetch(`/api/moderation/approve/${postId}`, { method: "POST" });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data?.error?.message || "Failed to approve post");
			}
			setQueue((prev) => prev.filter((item) => item.id !== postId));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to approve post");
		}
	};

	const remove = async (postId: string) => {
		try {
			const res = await fetch(`/api/moderation/delete/${postId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reason: reason[postId] || undefined }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data?.error?.message || "Failed to delete post");
			}
			setQueue((prev) => prev.filter((item) => item.id !== postId));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete post");
		}
	};

	return (
		<div className="space-y-6">
			<div className="rounded-xl border border-gray-200 bg-white p-6">
				<h1 className="text-xl font-semibold text-gray-900">Moderation Queue</h1>
				<p className="mt-2 text-sm text-gray-600">Approve or remove pending posts.</p>
			</div>

			<div className="rounded-xl border border-gray-200 bg-white p-6">
				{error && <p className="mb-3 text-sm text-red-600">{error}</p>}
				{loading ? (
					<p className="text-sm text-gray-500">Loading queue…</p>
				) : queue.length === 0 ? (
					<p className="text-sm text-gray-500">No posts waiting for approval.</p>
				) : (
					<div className="space-y-4">
						{queue.map((item) => (
							<div key={item.id} className="rounded-lg border border-gray-100 p-4">
								<div className="flex items-start justify-between">
									<div>
										<p className="text-sm font-semibold text-gray-900">{item.title}</p>
										<p className="mt-1 text-xs text-gray-500">
											{item.forum} · {item.author} · {new Date(item.createdAt).toLocaleString()}
										</p>
									</div>
									<span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-600">
										{item.status}
									</span>
								</div>
								<p className="mt-3 text-sm text-gray-700 line-clamp-3">{item.content}</p>
								{item.aiReason && (
									<div className="mt-2 flex flex-wrap items-center gap-2">
										<span className="rounded bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
											AI
										</span>
										{item.aiScore != null && (
											<span className={`rounded px-2 py-0.5 text-xs font-medium ${item.aiScore > 0.6 ? "bg-red-50 text-red-600" : item.aiScore > 0.3 ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-700"}`}>
												Risk {Math.round(item.aiScore * 100)}%
											</span>
										)}
										{item.aiLabel && (
											<span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
												{item.aiLabel}
											</span>
										)}
										<span className="text-xs text-gray-500 italic">{item.aiReason}</span>
									</div>
								)}
								<div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
									<input
										value={reason[item.id] || ""}
										onChange={(e) => setReason((prev) => ({ ...prev, [item.id]: e.target.value }))}
										placeholder="Optional reason for removal"
										className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
									/>
									<div className="flex gap-2">
										<button
											onClick={() => approve(item.id)}
											className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
										>
											Approve
										</button>
										<button
											onClick={() => remove(item.id)}
											className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
										>
											Delete
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
