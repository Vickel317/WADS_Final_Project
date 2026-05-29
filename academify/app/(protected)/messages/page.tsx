"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { getSocket } from "@/lib/socket-client";
import { authClient } from "@/lib/auth-client";
import type { ChatMessage, SpaceChatMessage } from "@/socket-server/index";
import NewMessageModal from "@/components/new-message-modal";

interface Conversation {
  userId: string;
  kind?: "direct" | "space";
  name: string;
  avatarUrl?: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const myId = session?.user?.id ?? "";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);

  // Load conversation list
  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((data) => setConversations(data.conversations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleSpacesUpdated = () => {
      fetch("/api/messages")
        .then((r) => r.json())
        .then((data) => setConversations(data.conversations ?? []))
        .catch(() => {});
    };

    const handleSpaceJoined = (ev: Event) => {
      try {
        const id = (ev as CustomEvent<{ spaceId?: string }>).detail?.spaceId;
        if (id) router.push(`/messages/space-${id}`);
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("spaces-updated", handleSpacesUpdated);
    window.addEventListener("space-joined", handleSpaceJoined as EventListener);
    return () => {
      window.removeEventListener("spaces-updated", handleSpacesUpdated);
      window.removeEventListener("space-joined", handleSpaceJoined as EventListener);
    };
  }, [router]);

  // Socket — update conversation list when a new message arrives
  useEffect(() => {
    if (!myId) return;
    const socket = getSocket();

    function onConnect() {
      socket.emit("authenticate", myId);
    }

    function onNewMessage(msg: ChatMessage) {
      const partnerId = msg.senderId === myId ? msg.receiverId : msg.senderId;
      setConversations((prev) => {
        const updated = prev.filter((c) => c.userId !== partnerId);
        const existing = prev.find((c) => c.userId === partnerId);
        return [
          {
            userId: partnerId,
            kind: "direct",
            name: existing?.name ?? partnerId,
            avatarUrl: existing?.avatarUrl ?? null,
            lastMessage: msg.content,
            lastAt: msg.createdAt,
            unread: msg.senderId !== myId ? (existing?.unread ?? 0) + 1 : 0,
          },
          ...updated,
        ];
      });
    }

    function onNewSpaceMessage(msg: SpaceChatMessage) {
      const convKey = `space-${msg.spaceId}`;
      setConversations((prev) => {
        const updated = prev.filter((c) => c.userId !== convKey);
        const existing = prev.find((c) => c.userId === convKey);
        return [
          {
            userId: convKey,
            kind: "space",
            name: existing?.name ?? `Space ${msg.spaceId}`,
            avatarUrl: null,
            lastMessage: msg.content,
            lastAt: msg.createdAt,
            unread: msg.senderId !== myId ? (existing?.unread ?? 0) + 1 : 0,
          },
          ...updated,
        ];
      });
    }

    socket.on("connect", onConnect);
    socket.on("new_message", onNewMessage);
    socket.on("new_space_message", onNewSpaceMessage);

    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit("authenticate", myId);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("new_message", onNewMessage);
      socket.off("new_space_message", onNewSpaceMessage);
    };
  }, [myId]);

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const directConversations = filtered.filter((c) => c.kind !== "space" && !c.userId.startsWith("space-"));
  const groupConversations = filtered.filter((c) => c.kind === "space" || c.userId.startsWith("space-"));

  const renderConversation = (conv: Conversation) => {
    const isGroup = conv.kind === "space" || conv.userId.startsWith("space-");
    return (
      <button
        key={conv.userId}
        onClick={() => router.push(`/messages/${conv.userId}`)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition text-left"
      >
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
          {isGroup ? (
            <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a5 5 0 100 10A5 5 0 0010 2zm0 12c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
            </svg>
          ) : conv.avatarUrl ? (
            <img src={conv.avatarUrl} alt={conv.name} className="w-full h-full object-cover" />
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {isGroup ? `Collab Space: ${conv.name}` : conv.name}
            </span>
            <span className="text-xs text-gray-400 shrink-0 ml-1">
              {formatDistanceToNow(new Date(conv.lastAt), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 truncate">{conv.lastMessage}</span>
            {conv.unread > 0 && (
              <span className="ml-1 shrink-0 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}>
                {conv.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <>
    {showNewMessage && <NewMessageModal onClose={() => setShowNewMessage(false)} />}
    <div className="relative flex flex-col lg:flex-row h-full bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Conversation List */}
      <div className="w-full lg:w-72 lg:shrink-0 border-r border-gray-100 flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">Messages</h2>
          <button
            onClick={() => setShowNewMessage(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-white transition"
            style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
            title="New message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="px-3 py-3 border-b border-gray-100">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:border-teal-400 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm gap-2">
              <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              No conversations yet
            </div>
          ) : (
            <>
              <div className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Personal Chats</div>
              <div className="divide-y divide-gray-50">
                {directConversations.length > 0 ? directConversations.map(renderConversation) : (
                  <div className="px-4 py-3 text-sm text-gray-400">No personal chats</div>
                )}
              </div>
              <div className="px-4 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Groups</div>
              <div className="divide-y divide-gray-50">
                {groupConversations.length > 0 ? groupConversations.map(renderConversation) : (
                  <div className="px-4 py-3 text-sm text-gray-400">No group chats</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Empty state */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}>
          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">Your Messages</h3>
        <p className="text-sm text-gray-400 max-w-xs">
          Select a conversation to start chatting, or hit <strong>+</strong> to find someone from your connections.
        </p>
      </div>
    </div>
    </>
  );
}
