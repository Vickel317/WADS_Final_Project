"use client";

import { useEffect, useState } from "react";
import { AdminBackLink } from "@/components/admin-back-link";

type AdminUser = {
	id: string;
	name: string;
	email: string;
	role: string;
	status: string;
	createdAt: string;
};

const roleOptions = ["student", "lecturer", "admin"];

function statusBadgeClass(status: string) {
	switch (status) {
		case "active":
			return "bg-emerald-50 text-emerald-700";
		case "warned":
			return "bg-amber-50 text-amber-700";
		case "suspended":
			return "bg-orange-50 text-orange-700";
		case "banned":
			return "bg-red-50 text-red-700";
		default:
			return "bg-gray-100 text-gray-600";
	}
}

export default function AdminUsersPage() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState<Record<string, boolean>>({});
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);

	const loadUsers = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/users");
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				const message = data?.error?.message || "Failed to load users";
				throw new Error(message);
			}
			setUsers(data.users || []);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load users");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void Promise.resolve().then(() => loadUsers());
		fetch("/api/users/me")
			.then((r) => r.json())
			.then((data) => setCurrentUserId(data.user?.userId ?? null))
			.catch(() => {});
	}, []);

	const updateRole = async (userId: string, role: string) => {
		setSaving((prev) => ({ ...prev, [userId]: true }));
		try {
			const res = await fetch(`/api/admin/users/${userId}/role`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ role }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				const message = data?.error?.message || "Failed to update role";
				throw new Error(message);
			}
			setUsers((prev) =>
				prev.map((user) => (user.id === userId ? { ...user, role } : user))
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update role");
		} finally {
			setSaving((prev) => ({ ...prev, [userId]: false }));
		}
	};

	const applySanction = async (
		userId: string,
		action: "warn" | "suspend" | "ban" | "restore"
	) => {
		if (action === "ban" && !confirm("Permanently ban this user from the platform?")) {
			return;
		}
		if (action === "restore" && !confirm("Restore this user to active status?")) {
			return;
		}

		let reason: string | undefined;
		let durationDays: number | undefined;

		if (action !== "restore") {
			const entered = window.prompt("Reason (required):");
			if (!entered?.trim()) return;
			reason = entered.trim();

			if (action === "suspend") {
				const daysRaw = window.prompt(
					"Suspend for how many days? (leave empty for indefinite)"
				);
				if (daysRaw?.trim()) {
					const parsed = Number(daysRaw.trim());
					if (!Number.isFinite(parsed) || parsed <= 0) {
						setError("Duration must be a positive number of days");
						return;
					}
					durationDays = parsed;
				}
			}
		}

		setSaving((prev) => ({ ...prev, [userId]: true }));
		try {
			const endpoint =
				action === "restore"
					? `/api/moderation/restore/${userId}`
					: `/api/moderation/${action}/${userId}`;
			const body =
				action === "restore"
					? JSON.stringify({ reason: reason || "Restored by admin" })
					: JSON.stringify({
							reason,
							...(durationDays !== undefined ? { durationDays } : {}),
						});

			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body,
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				const message = data?.error?.message || `Failed to ${action} user`;
				throw new Error(message);
			}

			const statusFromApi =
				typeof data.user?.accountStatus === "string"
					? data.user.accountStatus
					: undefined;
			const nextStatus =
				statusFromApi ??
				(action === "restore"
					? "active"
					: action === "warn"
						? "warned"
						: action);

			setUsers((prev) =>
				prev.map((user) =>
					user.id === userId ? { ...user, status: nextStatus } : user
				)
			);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : `Failed to ${action} user`);
		} finally {
			setSaving((prev) => ({ ...prev, [userId]: false }));
		}
	};

	const deleteUser = async (userId: string) => {
		if (!confirm("Delete this user account?")) return;
		setSaving((prev) => ({ ...prev, [userId]: true }));
		try {
			const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				const message = data?.error?.message || "Failed to delete user";
				throw new Error(message);
			}
			setUsers((prev) => prev.filter((user) => user.id !== userId));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete user");
		} finally {
			setSaving((prev) => ({ ...prev, [userId]: false }));
		}
	};

	return (
		<div className="space-y-6">
			<AdminBackLink />
			<div className="rounded-xl border border-gray-200 bg-white p-6">
				<h1 className="text-xl font-semibold text-gray-900">Admin Users</h1>
				<p className="mt-2 text-sm text-gray-600">
					Manage platform roles and account status. Student and lecturer are titles only —
					forum moderators are assigned per forum.
				</p>
				<ul className="mt-3 space-y-1 text-xs text-gray-500">
					<li>
						<span className="font-medium text-amber-700">Warned</span> — flagged on record;
						user can still post, comment, message, and upload.
					</li>
					<li>
						<span className="font-medium text-orange-700">Suspended</span> — blocked from
						posting, commenting, DMs, and file uploads.
					</li>
					<li>
						<span className="font-medium text-red-700">Banned</span> — same restrictions as
						suspended (platform-wide).
					</li>
				</ul>
			</div>

			<div className="rounded-xl border border-gray-200 bg-white p-6">
				{error && <p className="mb-3 text-sm text-red-600">{error}</p>}
				{loading ? (
					<p className="text-sm text-gray-500">Loading users…</p>
				) : (
					<div className="overflow-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="text-xs uppercase text-gray-500">
								<tr>
									<th className="py-2 pr-4">Name</th>
									<th className="py-2 pr-4">Email</th>
									<th className="py-2 pr-4">Role</th>
									<th className="py-2 pr-4">Status</th>
									<th className="py-2 pr-4">Actions</th>
								</tr>
							</thead>
							<tbody className="text-gray-700">
								{users.map((user) => {
									const isSelf = user.id === currentUserId;
									const busy = saving[user.id];
									return (
										<tr key={user.id} className="border-t border-gray-100">
											<td className="py-3 pr-4 font-medium text-gray-900">
												{user.name}
												{isSelf && (
													<span className="ml-1.5 text-xs text-gray-400">(you)</span>
												)}
											</td>
											<td className="py-3 pr-4">{user.email}</td>
											<td className="py-3 pr-4">
												<select
													value={user.role}
													onChange={(e) => updateRole(user.id, e.target.value)}
													className="rounded-lg border border-gray-200 px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
													disabled={busy || isSelf}
												>
													{roleOptions.map((role) => (
														<option key={role} value={role}>
															{role}
														</option>
													))}
												</select>
											</td>
											<td className="py-3 pr-4">
												<span
													className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(user.status)}`}
												>
													{user.status}
												</span>
											</td>
											<td className="py-3 pr-4">
												<div className="flex flex-wrap gap-1.5">
													{user.status !== "active" && (
														<button
															type="button"
															onClick={() => applySanction(user.id, "restore")}
															className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
															disabled={busy || isSelf}
														>
															Restore
														</button>
													)}
													<button
														type="button"
														onClick={() => applySanction(user.id, "warn")}
														className="rounded-lg border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
														disabled={busy || isSelf}
													>
														Warn
													</button>
													<button
														type="button"
														onClick={() => applySanction(user.id, "suspend")}
														className="rounded-lg border border-orange-200 px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
														disabled={busy || isSelf}
													>
														Suspend
													</button>
													<button
														type="button"
														onClick={() => applySanction(user.id, "ban")}
														className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
														disabled={busy || isSelf}
													>
														Ban
													</button>
													<button
														type="button"
														onClick={() => deleteUser(user.id)}
														className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
														disabled={busy || isSelf}
													>
														Delete
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
