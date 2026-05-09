"use client";

import { useEffect, useState } from "react";

type AdminUser = {
	id: string;
	name: string;
	email: string;
	role: string;
	status: string;
	createdAt: string;
};

const roleOptions = ["student", "moderator", "admin"];

export default function AdminUsersPage() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState<Record<string, boolean>>({});

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
		loadUsers();
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
			<div className="rounded-xl border border-gray-200 bg-white p-6">
				<h1 className="text-xl font-semibold text-gray-900">Admin Users</h1>
				<p className="mt-2 text-sm text-gray-600">
					Manage platform users and roles.
				</p>
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
								{users.map((user) => (
									<tr key={user.id} className="border-t border-gray-100">
										<td className="py-3 pr-4 font-medium text-gray-900">
											{user.name}
										</td>
										<td className="py-3 pr-4">{user.email}</td>
										<td className="py-3 pr-4">
											<select
												value={user.role}
												onChange={(e) => updateRole(user.id, e.target.value)}
												className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
												disabled={saving[user.id]}
											>
												{roleOptions.map((role) => (
													<option key={role} value={role}>
														{role}
													</option>
												))}
											</select>
										</td>
										<td className="py-3 pr-4 capitalize">{user.status}</td>
										<td className="py-3 pr-4">
											<button
												onClick={() => deleteUser(user.id)}
												className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
												disabled={saving[user.id]}
											>
												Delete
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
