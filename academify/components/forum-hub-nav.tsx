"use client";

import Link from "next/link";

export type ForumHubTab = "threads" | "events" | "collab";

const TABS: { id: ForumHubTab; label: string }[] = [
  { id: "threads", label: "Threads" },
  { id: "events", label: "Events" },
  { id: "collab", label: "Collab spaces" },
];

export function ForumHubNav({
  forumSlug,
  activeTab,
}: {
  forumSlug: string;
  activeTab: ForumHubTab;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3 mb-5">
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Link
            key={tab.id}
            href={`/forums/${forumSlug}?tab=${tab.id}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              active
                ? "bg-teal-50 text-teal-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
