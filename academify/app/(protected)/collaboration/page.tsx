"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SPACE_METRICS = [
  { label: "Active spaces", value: "0", note: "loaded from the database" },
  { label: "Shared files", value: "0", note: "connected files will appear here" },
  { label: "Open tasks", value: "0", note: "no seeded tasks remain" },
  { label: "Forums linked", value: "0", note: "spaces attached to forum hubs" },
] as const;

export default function CollaborationPage() {
  const [spaces, setSpaces] = useState<Array<{ spaceID: string; name: string; description: string | null; forumID: string }>>([]);
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState<string | null>(null);
  const [newForumID, setNewForumID] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [spacesResponse, filesResponse] = await Promise.all([
          fetch("/api/collaboration"),
          fetch("/api/files"),
        ]);

        const spacesPayload = await spacesResponse.json().catch(() => ({}));
        const filesPayload = await filesResponse.json().catch(() => ({}));

        if (!spacesResponse.ok) {
          throw new Error(spacesPayload?.error?.message || "Failed to load collaboration spaces");
        }
        if (!filesResponse.ok) {
          throw new Error(filesPayload?.error?.message || "Failed to load files");
        }

        setSpaces(
          (spacesPayload.spaces || []).map((space: { spaceID: string; name: string; description: string | null; forumID: string }) => space)
        );
        setFileCount((filesPayload.files || []).length);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-teal-100 bg-linear-to-br from-slate-950 via-teal-900 to-cyan-700 p-6 text-white shadow-sm">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_28%)]" />
        <div className="relative flex flex-col gap-5">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
              Collaboration Space
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">One workspace for shared files, live feedback, and team execution.</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
                Keep every assignment, revision pack, and discussion thread attached to the right room so your group can move faster without losing context.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {SPACE_METRICS.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">{metric.label}</p>
                <p className="mt-2 text-3xl font-bold">{metric.value}</p>
                <p className="mt-1 text-xs text-white/70">{metric.note}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/files" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-white/90">
              Back to files
            </Link>
            <Link href="/messages" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
              Open chat
            </Link>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-white"
            >
              Create space
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Active spaces</h2>
                <p className="text-sm text-gray-500">Each space keeps its files, discussion, and checkpoints together.</p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">Shared by class groups</span>
            </div>

            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-gray-500">Loading collaboration spaces...</p>
              ) : spaces.length ? (
                spaces.map((space) => (
                <article key={space.spaceID} className="rounded-2xl border border-gray-100 p-4 transition hover:border-teal-200 hover:shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{space.name}</h3>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                          Forum space
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{space.description ?? "No description provided."}</p>
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 lg:min-w-55">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Forum ID</span>
                        <span className="font-semibold text-gray-900 block max-w-40 truncate">{space.forumID}</span>
                      </div>
                      <div className="h-2 rounded-full bg-linear-to-r from-teal-600 to-cyan-500" />
                      <p className="text-xs text-gray-500">Created from live database records</p>
                      <Link href={`/messages/space-${space.spaceID}`} className="rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700">
                        Enter space
                      </Link>
                    </div>
                  </div>
                </article>
                ))
              ) : (
                <p className="text-sm text-gray-500">No collaboration spaces found.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Shared files by space</h2>
                <p className="text-sm text-gray-500">A quick view of what is currently attached to each workspace.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 px-4 py-3 text-sm text-gray-500">
              Shared file list is now driven by the files page. Current files: {fileCount}.
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Live activity</h2>
            <p className="text-sm text-gray-500">Recent collaboration updates will appear here once activity tracking is connected.</p>
            <div className="mt-4 rounded-2xl border border-gray-100 px-4 py-3 text-sm text-gray-500">
              No seeded activity remains.
            </div>
          </div>

          <div className="rounded-3xl border border-teal-100 bg-linear-to-br from-teal-50 to-cyan-50 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Collaboration rules</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <p>• Keep one source of truth per project room.</p>
              <p>• Pin meeting notes before the next session starts.</p>
              <p>• Share large files through the matching workspace, not DMs.</p>
            </div>
          </div>
        </aside>
      </section>
      {/* Create space modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Create collaboration space</h3>
            <p className="text-sm text-gray-500 mt-1">Create a new workspace for your team.</p>

            <label className="mt-4 block text-xs font-medium text-gray-600">Name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />

            <label className="mt-3 block text-xs font-medium text-gray-600">Description (optional)</label>
            <input value={newDescription ?? ""} onChange={(e) => setNewDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />

            <label className="mt-3 block text-xs font-medium text-gray-600">Forum ID (optional)</label>
            <input value={newForumID} onChange={(e) => setNewForumID(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />

            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600">Cancel</button>
              <button
                onClick={async () => {
                  if (!newName.trim()) return alert("Please provide a name");
                  setCreating(true);
                  try {
                    const res = await fetch("/api/collaboration", {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: newName.trim(), description: newDescription, forumID: newForumID }),
                    });
                    const payload = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(payload?.error?.message || "Create failed");
                    
                    const space = payload.space;
                    setSpaces((s) => [space, ...s]);
                    setShowCreate(false);
                    setNewName("");
                    setNewDescription(null);
                    setNewForumID("");
                  } catch (err) {
                    alert("Failed to create space");
                  } finally {
                    setCreating(false);
                  }
                }}
                disabled={creating}
                className="flex-1 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}