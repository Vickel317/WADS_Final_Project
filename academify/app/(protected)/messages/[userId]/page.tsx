"use client";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

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

const mockMessages: Record<string, { id: number; text: string; sender: "me" | "them"; time: string }[]> = {
  "sarah-chen": [
    { id: 1, sender: "them", text: "Hey! Did you understand the dynamic programming lecture today?", time: "10:32 AM" },
    { id: 2, sender: "me",   text: "Not completely, I'm stuck on the knapsack problem", time: "10:35 AM" },
    { id: 3, sender: "them", text: "I can help! Let me explain the approach I used", time: "10:36 AM" },
    { id: 4, sender: "them", text: "First, you need to understand the subproblem structure. Think about it this way: for each item, you have two choices...", time: "10:37 AM" },
    { id: 5, sender: "me",   text: "That makes sense! So we build the solution bottom-up", time: "10:40 AM" },
    { id: 6, sender: "them", text: "Exactly! Want to meet up later to go through more examples?", time: "10:42 AM" },
  ],
  "study-group-cs30": [
    { id: 1, sender: "them", text: "Meeting tomorrow at 3 PM in the library, everyone!", time: "Yesterday" },
    { id: 2, sender: "me",   text: "I'll be there 👍", time: "Yesterday" },
  ],
  "mike-johnson": [
    { id: 1, sender: "me",   text: "Hey Mike, I shared those notes with you.", time: "1h ago" },
    { id: 2, sender: "them", text: "Thanks for sharing those notes!", time: "1h ago" },
  ],
  "emma-wilson": [
    { id: 1, sender: "them", text: "Did you finish the assignment?", time: "3h ago" },
    { id: 2, sender: "me",   text: "Almost done, just the last section!", time: "3h ago" },
  ],
  "ml-project-team": [
    { id: 1, sender: "them", text: "Alex: Great progress on the model!!", time: "1d ago" },
  ],
};

export default function ConversationPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(mockMessages[userId] ?? []);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConv = mockConversations.find((c) => c.id === userId);
  const filtered = mockConversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    const newMsg = { id: Date.now(), sender: "me" as const, text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    try {
      await fetch(`/api/messages/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
    } catch {
      // Optimistic update already applied
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
          {filtered.map((conv) => {
            const isActive = conv.id === userId;
            return (
              <button
                key={conv.id}
                onClick={() => router.push(`/messages/${conv.id}`)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition text-left ${
                  isActive ? "bg-teal-50" : "hover:bg-gray-50"
                }`}
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
                    <span className={`text-sm font-semibold truncate ${isActive ? "text-teal-700" : "text-gray-900"}`}>
                      {conv.name}
                    </span>
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
            );
          })}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              {activeConv?.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{activeConv?.name ?? userId}</p>
              <p className="text-xs text-green-500 font-medium">
                {activeConv?.online ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "them" && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mb-5">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "me"
                      ? "text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                  style={
                    msg.sender === "me"
                      ? { background: "linear-gradient(135deg, #0d9488, #0f766e)" }
                      : {}
                  }
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="shrink-0 px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-400/30 transition">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}