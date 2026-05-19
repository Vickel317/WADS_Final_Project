import Link from "next/link";

const SPACE_METRICS = [
  { label: "Active spaces", value: "08", note: "project and study rooms" },
  { label: "Online members", value: "34", note: "ready to review files" },
  { label: "Shared files", value: "126", note: "all linked to a space" },
  { label: "Open tasks", value: "19", note: "assignments and checklists" },
] as const;

const SPACES = [
  {
    name: "Capstone Sprint",
    tag: "Team project",
    description: "Coordinate milestones, attach spec documents, and keep weekly decisions visible to everyone.",
    members: ["Alya", "Rafi", "Mira", "Dion"],
    files: 18,
    updates: "Last sync 12 minutes ago",
    accent: "from-teal-600 to-cyan-500",
  },
  {
    name: "Data Structures Lab",
    tag: "Course room",
    description: "Store lecture notes, review problem sets, and keep code snippets pinned for the whole group.",
    members: ["Sarah", "Kevin", "Diana"],
    files: 11,
    updates: "3 new notes added today",
    accent: "from-blue-600 to-indigo-500",
  },
  {
    name: "Study Group Hub",
    tag: "Revision space",
    description: "Fast updates, flashcards, and reminders for sessions that need quick coordination.",
    members: ["Alex", "Nadia", "Hugo"],
    files: 9,
    updates: "Next meeting tomorrow at 7 PM",
    accent: "from-violet-600 to-fuchsia-500",
  },
] as const;

const SHARED_FILES = [
  { name: "Sprint_Requirements.pdf", scope: "Capstone Sprint", size: "2.8 MB" },
  { name: "Complexity_Notes.docx", scope: "Data Structures Lab", size: "1.2 MB" },
  { name: "Exam_Revision_Pack.zip", scope: "Study Group Hub", size: "24.4 MB" },
] as const;

const ACTIVITY = [
  { actor: "Sarah", action: "uploaded a revised UML diagram", time: "2 min ago" },
  { actor: "Alya", action: "pinned the sprint checklist", time: "17 min ago" },
  { actor: "Rafi", action: "commented on the thesis outline", time: "42 min ago" },
  { actor: "Mira", action: "shared meeting notes with the team", time: "1h ago" },
] as const;

export default function CollaborationPage() {
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
              {SPACES.map((space) => (
                <article key={space.name} className="rounded-2xl border border-gray-100 p-4 transition hover:border-teal-200 hover:shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{space.name}</h3>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                          {space.tag}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{space.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {space.members.map((member) => (
                          <span key={member} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 lg:min-w-55">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Shared files</span>
                        <span className="font-semibold text-gray-900">{space.files}</span>
                      </div>
                      <div className={`h-2 rounded-full bg-linear-to-r ${space.accent}`} />
                      <p className="text-xs text-gray-500">{space.updates}</p>
                      <button className="rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700">
                        Enter space
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Shared files by space</h2>
                <p className="text-sm text-gray-500">A quick view of what is currently attached to each workspace.</p>
              </div>
            </div>

            <div className="space-y-3">
              {SHARED_FILES.map((file) => (
                <div key={file.name} className="flex flex-col gap-2 rounded-2xl border border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.scope}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-500">{file.size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Live activity</h2>
            <p className="text-sm text-gray-500">Recent collaboration updates from your spaces.</p>

            <div className="mt-4 space-y-3">
              {ACTIVITY.map((item) => (
                <div key={`${item.actor}-${item.time}`} className="flex items-start gap-3 rounded-2xl border border-gray-100 px-3 py-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                    {item.actor.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">{item.actor}</span> {item.action}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{item.time}</p>
                  </div>
                </div>
              ))}
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
    </div>
  );
}