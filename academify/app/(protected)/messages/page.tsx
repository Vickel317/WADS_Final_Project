"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const mockConversations = [
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    online: true,
    lastMessage: "Sure! I can help with that algorithm p...",
    time: "2m",
    unread: 0,
    type: "dm",
  },
  {
    id: "study-group-cs30",
    name: "Study Group - CS30",
    online: false,
    lastMessage: "Meeting tomorrow at 3 PM in the libra...",
    time: "15m",
    unread: 3,
    type: "group",
  },
  {
    id: "mike-johnson",
    name: "Mike Johnson",
    online: true,
    lastMessage: "Thanks for sharing those notes!",
    time: "1h",
    unread: 0,
    type: "dm",
  },
  {
    id: "emma-wilson",
    name: "Emma Wilson",
    online: false,
    lastMessage: "Did you finish the assignment?",
    time: "3h",
    unread: 0,
    type: "dm",
  },
  {
    id: "ml-project-team",
    name: "ML Project Team",
    online: false,
    lastMessage: "Alex: Great progress on the model!!",
    time: "1d",
    unread: 0,
    type: "group",
  },
];

export default function MessagesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = mockConversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Conversation List */}
      <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Messages</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-xl text-white transition"
            style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations"
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 placeholder-gray-400 focus:outline-none focus:border-teal-400 transition"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => router.push(`/messages/${conv.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition text-left"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                {conv.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-gray-900 truncate">{conv.name}</span>
                  <span className="text-xs text-gray-400 shrink-0 ml-1">{conv.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 truncate">{conv.lastMessage}</span>
                  {conv.unread > 0 && (
                    <span
                      className="ml-1 shrink-0 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
                    >
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}
        >
          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">Your Messages</h3>
        <p className="text-sm text-gray-400 max-w-xs">
          Select a conversation from the left to start chatting, or click the <strong>+</strong> button to start a new one.
        </p>
      </div>
    </div>
  );
}