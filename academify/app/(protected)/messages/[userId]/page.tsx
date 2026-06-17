"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { getSocket } from "@/lib/socket-client";
import { authClient } from "@/lib/auth-client";
import type { ChatMessage, SpaceChatMessage } from "@/socket-server/index";
import NewMessageModal from "@/components/new-message-modal";
import { ChatAvatar } from "@/components/chat-avatar";
import { ChatProfilePopover } from "@/components/chat-profile-popover";
import { ChatTypingBubble } from "@/components/chat-typing-bubble";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
  senderName?: string;
  senderAvatarUrl?: string | null;
}

interface Conversation {
  userId: string;
  kind?: "direct" | "space";
  name: string;
  avatarUrl?: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

interface PartnerProfile {
  id: string;
  name: string;
  educationLevel: string;
  avatarUrl: string | null;
}

export default function ConversationPage() {
  const { userId: partnerId } = useParams<{ userId: string }>();
  const isSpaceChat = partnerId.startsWith("space-");
  const spaceId = isSpaceChat ? partnerId.slice("space-".length) : "";
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [resolvedMyId, setResolvedMyId] = useState("");
  const myId = session?.user?.id ?? resolvedMyId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [spaceName, setSpaceName] = useState<string | null>(null);
  const [spaceNameLoading, setSpaceNameLoading] = useState(isSpaceChat);
  const resolvedSpaceName = spaceName
    ?? conversations.find((c) => c.userId === `space-${spaceId}`)?.name
    ?? (spaceNameLoading ? null : `Collab space`);
  const conversationPartnerName = conversations.find((c) => c.userId === partnerId)?.name;
  const displayPartnerName = isSpaceChat
    ? (resolvedSpaceName ?? "Loading...")
    : (partnerProfile?.name ?? conversationPartnerName ?? "Loading...");
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [spaceTypers, setSpaceTypers] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMessageAt = useRef<string | null>(null);

  const clearActiveUnread = useCallback(() => {
    setConversations((prev) =>
      prev.map((c) => (c.userId === partnerId ? { ...c, unread: 0 } : c))
    );
  }, [partnerId]);

  const spaceTypingActive = isSpaceChat && Object.keys(spaceTypers).length > 0;
  const spaceTypingLabel = useMemo(() => {
    const names = Object.values(spaceTypers);
    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} is typing…`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
    return `${names.length} people are typing…`;
  }, [spaceTypers]);

  const emitSpaceTyping = useCallback(() => {
    if (!isSpaceChat || !spaceId || !myId) return;
    const socket = getSocket();
    const name = session?.user?.name ?? "Someone";
    socket.emit("space_typing", { spaceId, name });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("space_stop_typing", { spaceId });
    }, 1500);
  }, [isSpaceChat, myId, session?.user?.name, spaceId]);

  const emitSpaceStopTyping = useCallback(() => {
    if (!isSpaceChat || !spaceId) return;
    getSocket().emit("space_stop_typing", { spaceId });
  }, [isSpaceChat, spaceId]);

  useEffect(() => {
    let cancelled = false;

    const resolveSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return;

        const data = (await res.json().catch(() => null)) as { id?: string } | null;
        if (!cancelled && data?.id) {
          setResolvedMyId(data.id);
        }
      } catch {
        // ignore; authClient may still resolve shortly after account switch
      }
    };

    if (!session?.user?.id) {
      void resolveSession();
    }

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // Focus message input when opening a conversation
  useEffect(() => {
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [partnerId]);

  // Enter or typing a character focuses the message box (when not already in a field)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const isEnter = e.key === "Enter" && !e.shiftKey;
      const isPrintable = e.key.length === 1 && !e.isComposing;
      if (!isEnter && !isPrintable) return;

      const input = inputRef.current;
      if (!input || input.disabled) return;

      if (isPrintable) {
        e.preventDefault();
        input.focus();
        setInput((prev) => prev + e.key);
        if (isSpaceChat) {
          emitSpaceTyping();
        } else {
          const socket = getSocket();
          socket.emit("typing", { to: partnerId });
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => {
            socket.emit("stop_typing", { to: partnerId });
          }, 1500);
        }
        return;
      }

      input.focus();
      if (isEnter) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSpaceChat, partnerId, emitSpaceTyping]);
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, spaceTypingActive]);

  // Load conversation list
  const refreshConversations = useCallback(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((data) => setConversations(data.conversations ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshConversations();
      }
    };
    window.addEventListener("focus", refreshConversations);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refreshConversations);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshConversations]);

  // Fetch space name for space chats
  useEffect(() => {
    if (!isSpaceChat || !spaceId) return;
    let cancelled = false;

    void (async () => {
      setSpaceNameLoading(true);
      try {
        const r = await fetch("/api/collaboration");
        const data = await r.json();
        if (cancelled) return;
        const space = (data.spaces ?? []).find((s: { spaceID: string }) => s.spaceID === spaceId);
        if (space?.name) setSpaceName(space.name);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setSpaceNameLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSpaceChat, spaceId]);

  useEffect(() => {
    const handleSpacesUpdated = () => {
      refreshConversations();
    };

    window.addEventListener("spaces-updated", handleSpacesUpdated);
    return () => window.removeEventListener("spaces-updated", handleSpacesUpdated);
  }, [refreshConversations]);

  useEffect(() => {
    if (isSpaceChat || !partnerId) return;

    let cancelled = false;

    const loadPartnerProfile = async () => {
      try {
        const res = await fetch(`/api/users/${partnerId}`);
        if (!res.ok) return;
        const data = (await res.json().catch(() => null)) as
          | { user?: { id?: string; name?: string; year?: string; avatarUrl?: string | null } }
          | null;
        const user = data?.user;
        if (!cancelled && user?.id) {
          setPartnerProfile({
            id: user.id,
            name: user.name ?? "Unknown User",
            educationLevel: user.year ?? "",
            avatarUrl: user.avatarUrl ?? null,
          });
        }
      } catch {
        // ignore; keep the fallback label from the conversation list
      }
    };

    void loadPartnerProfile();

    return () => {
      cancelled = true;
    };
  }, [isSpaceChat, partnerId]);

  // Load messages for this conversation
  const loadMessages = useCallback(
    async (since?: string) => {
      try {
        const baseUrl = isSpaceChat ? `/api/messages/space/${spaceId}` : `/api/messages/${partnerId}`;
        const url = since ? `${baseUrl}?since=${encodeURIComponent(since)}` : baseUrl;
        const res = await fetch(url);
        const data = await res.json();
        const fetched: Message[] = data.messages ?? [];
        if (since) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newOnes = fetched.filter((m) => !existingIds.has(m.id));
            return [...prev, ...newOnes];
          });
        } else {
          setMessages(fetched);
          if (fetched.length > 0) {
            lastMessageAt.current = fetched[fetched.length - 1].createdAt;
          }
        }
        clearActiveUnread();
      } catch {
        // ignore
      } finally {
        setLoadingMsgs(false);
      }
    },
    [isSpaceChat, partnerId, spaceId, setMessages, clearActiveUnread]
  );

  useEffect(() => {
    if (!partnerId) return;
    let cancelled = false;
    const frameId = requestAnimationFrame(() => {
      if (cancelled) return;
      setSpaceTypers({});
      setIsTyping(false);
      setLoadingMsgs(true);
      setMessages([]);
      void loadMessages();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [partnerId, loadMessages]);

  // Socket setup
  useEffect(() => {
    if (!myId || !partnerId) return;
    const socket = getSocket();

    // Re-authenticate whenever the socket (re)connects — this is the critical handler.
    // Without it, after a disconnect/reconnect myUserId on the server is gone and
    // all send_message events get silently dropped.
    function onConnect() {
      socket.emit("authenticate", myId);
    }

    function onAuthenticated() {
      if (isSpaceChat && spaceId) {
        socket.emit("join_space", { spaceId });
      }

      // Catch-up: fetch messages missed while disconnected
      if (lastMessageAt.current) {
        loadMessages(lastMessageAt.current);
      }

      if (!isSpaceChat) {
        socket.emit("check_online", partnerId, (online: boolean) => {
          setPartnerOnline(online);
        });
      }
    }

    function onNewMessage(msg: ChatMessage) {
      if (isSpaceChat) return;
      if (msg.senderId !== partnerId && msg.receiverId !== partnerId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        lastMessageAt.current = msg.createdAt;
        return [...prev, msg];
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.userId === partnerId
            ? { ...c, kind: "direct", lastMessage: msg.content, lastAt: msg.createdAt, unread: 0 }
            : c
        )
      );
    }

    function onNewSpaceMessage(msg: SpaceChatMessage) {
      if (!isSpaceChat || msg.spaceId !== spaceId) return;

      // Refresh from API so each user sees their own persisted message rows.
      if (lastMessageAt.current) {
        void loadMessages(lastMessageAt.current);
      } else {
        void loadMessages();
      }
    }

    function onTyping({ from }: { from: string }) {
      if (from === partnerId) setIsTyping(true);
    }

    function onStopTyping({ from }: { from: string }) {
      if (from === partnerId) setIsTyping(false);
    }

    function onSpaceTyping({
      spaceId: sid,
      userId,
      name,
    }: {
      spaceId: string;
      userId: string;
      name?: string;
    }) {
      if (!isSpaceChat || sid !== spaceId || userId === myId) return;
      setSpaceTypers((prev) => ({ ...prev, [userId]: name || "Someone" }));
    }

    function onSpaceStopTyping({ spaceId: sid, userId }: { spaceId: string; userId: string }) {
      if (!isSpaceChat || sid !== spaceId) return;
      setSpaceTypers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }

    // Register listeners BEFORE connecting so no events are missed
    socket.on("connect", onConnect);
    socket.on("authenticated", onAuthenticated);
    socket.on("new_message", onNewMessage);
    socket.on("new_space_message", onNewSpaceMessage);
    socket.on("typing", onTyping);
    socket.on("stop_typing", onStopTyping);
    socket.on("space_typing", onSpaceTyping);
    socket.on("space_stop_typing", onSpaceStopTyping);

    // Connect (or authenticate immediately if already connected)
    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit("authenticate", myId);
    }

    // Initial online check (may arrive before authenticated fires)
    if (!isSpaceChat) {
      socket.emit("check_online", partnerId, (online: boolean) => {
        setPartnerOnline(online);
      });
    }

    return () => {
      if (isSpaceChat && spaceId) {
        socket.emit("leave_space", { spaceId });
      }
      socket.off("connect", onConnect);
      socket.off("authenticated", onAuthenticated);
      socket.off("new_message", onNewMessage);
      socket.off("new_space_message", onNewSpaceMessage);
      socket.off("typing", onTyping);
      socket.off("stop_typing", onStopTyping);
      socket.off("space_typing", onSpaceTyping);
      socket.off("space_stop_typing", onSpaceStopTyping);
    };
  }, [isSpaceChat, loadMessages, myId, partnerId, spaceId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (isSpaceChat) {
      emitSpaceTyping();
      return;
    }
    const socket = getSocket();
    socket.emit("typing", { to: partnerId });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("stop_typing", { to: partnerId });
    }, 1500);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    let currentUserId = myId;

    if (!currentUserId) {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json().catch(() => null)) as { id?: string } | null;
          if (data?.id) {
            currentUserId = data.id;
            setResolvedMyId(data.id);
          }
        }
      } catch {
        // ignore and fall through to the existing error message
      }

      if (!currentUserId) {
        setSendError("Session not ready — please wait a moment and try again.");
        return;
      }
    }
    setSendError(null);
    setSending(true);
    setInput("");
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isSpaceChat) {
      emitSpaceStopTyping();
    } else {
      getSocket().emit("stop_typing", { to: partnerId });
    }

    try {
      const endpoint = isSpaceChat ? `/api/messages/space/${spaceId}` : `/api/messages/${partnerId}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data?.message ?? "Failed to send message");
        setInput(text);
        return;
      }

      const saved: Message = data.data;
      lastMessageAt.current = saved.createdAt;

      setMessages((prev) => {
        if (prev.some((m) => m.id === saved.id)) return prev;
        return [...prev, saved];
      });

      if (isSpaceChat) {
        getSocket().emit("send_space_message", {
          id: saved.id,
          senderId: saved.senderId,
          spaceId,
          content: saved.content,
          createdAt: saved.createdAt,
        } satisfies SpaceChatMessage);

        setConversations((prev) => {
          const filtered = prev.filter((c) => c.userId !== partnerId);
          const existing = prev.find((c) => c.userId === partnerId);
          return [
            {
              userId: partnerId,
              kind: "space",
              name: existing?.name ?? resolvedSpaceName ?? "Collab space",
              avatarUrl: null,
              lastMessage: saved.content,
              lastAt: saved.createdAt,
              unread: 0,
            },
            ...filtered,
          ];
        });
      } else {
        // Relay to recipient in real-time
        getSocket().emit("send_message", saved);

        setConversations((prev) => {
          const filtered = prev.filter((c) => c.userId !== partnerId);
          const existing = prev.find((c) => c.userId === partnerId);
          return [
            {
              userId: partnerId,
              kind: "direct",
              name: existing?.name ?? partnerProfile?.name ?? "Unknown User",
              lastMessage: saved.content,
              lastAt: saved.createdAt,
              unread: 0,
            },
            ...filtered,
          ];
        });
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send message");
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    if (e.nativeEvent.isComposing) return;
    e.preventDefault();
    void sendMessage();
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage();
  };

  const filteredConvs = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const directConvs = filteredConvs.filter((c) => c.kind !== "space" && !c.userId.startsWith("space-"));
  const groupConvs = filteredConvs.filter((c) => c.kind === "space" || c.userId.startsWith("space-"));

  const renderConversation = (conv: Conversation) => {
    const isGroupConv = conv.kind === "space" || conv.userId.startsWith("space-");
    const isActive = conv.userId === partnerId;
    return (
      <button
        key={conv.userId}
        onClick={() => router.push(`/messages/${conv.userId}`)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 transition text-left ${isActive ? "bg-teal-50" : "hover:bg-gray-50"}`}
      >
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
          {isGroupConv ? (
            <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a5 5 0 100 10A5 5 0 0010 2zm0 12c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
            </svg>
          ) : conv.avatarUrl ? (
            <ChatAvatar src={conv.avatarUrl} alt={conv.name} />
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className={`text-sm font-semibold truncate ${isActive ? "text-teal-700" : "text-gray-900"}`}>
              {isGroupConv ? `Collab Space: ${conv.name.replace(/^Space\s+/, "")}` : conv.name}
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
    <div className="flex h-full min-h-0 w-full bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Sidebar — conversation list */}
      <div className="hidden lg:flex w-72 shrink-0 border-r border-gray-100 flex-col h-full min-h-0">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Messages</h2>
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
              placeholder="Search conversations"
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 placeholder-gray-400 focus:outline-none focus:border-teal-400 transition"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Personal Chats</div>
          <div className="divide-y divide-gray-50">
            {directConvs.length > 0 ? directConvs.map(renderConversation) : (
              <div className="px-4 py-3 text-sm text-gray-400">No personal chats</div>
            )}
          </div>
          <div className="px-4 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Groups</div>
          <div className="divide-y divide-gray-50">
            {groupConvs.length > 0 ? groupConvs.map(renderConversation) : (
              <div className="px-4 py-3 text-sm text-gray-400">No group chats</div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div
        className="flex-1 flex flex-col min-w-0 min-h-0 h-full outline-none"
        tabIndex={-1}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/messages")}
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {!isSpaceChat && partnerId ? (
              <ChatProfilePopover userId={partnerId} side="bottom">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {partnerProfile?.avatarUrl ? (
                      <ChatAvatar src={partnerProfile.avatarUrl} alt={partnerProfile.name} size={36} />
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {partnerOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                  )}
                </div>
              </ChatProfilePopover>
            ) : (
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
            <div>
              {!isSpaceChat && partnerId ? (
                <ChatProfilePopover userId={partnerId} side="bottom">
                  <p className="text-sm font-bold text-gray-900 hover:text-teal-700 transition cursor-pointer">
                    {displayPartnerName}
                  </p>
                </ChatProfilePopover>
              ) : (
                <p className="text-sm font-bold text-gray-900">{displayPartnerName}</p>
              )}
              {isSpaceChat ? (
                <p className={`text-xs font-medium ${spaceTypingActive ? "text-teal-600" : "text-gray-400"}`}>
                  {spaceTypingActive ? spaceTypingLabel : "Collaboration space chat"}
                </p>
              ) : (
                <p className={`text-xs font-medium ${partnerOnline ? "text-green-500" : "text-gray-400"}`}>
                  {isTyping ? "typing…" : partnerOnline ? "Online" : "Offline"}
                </p>
              )}
              {!isSpaceChat && partnerProfile?.educationLevel && (
                <p className="text-[11px] text-gray-400">{partnerProfile.educationLevel}</p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-3"
        >
          {loadingMsgs ? (
            <div className="flex justify-center text-gray-400 text-sm py-8">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
              <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              No messages yet — say hi!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === myId;
              const senderLabel = msg.senderName ?? (isMe ? "You" : "Unknown User");
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <ChatProfilePopover userId={msg.senderId} side="right">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mb-5 overflow-hidden">
                        {msg.senderAvatarUrl ? (
                          <ChatAvatar src={msg.senderAvatarUrl} alt={senderLabel} size={32} />
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </ChatProfilePopover>
                  )}
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && isSpaceChat && (
                      <span className="text-[11px] font-semibold text-gray-500 px-1 mb-1">
                        {senderLabel}
                      </span>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe ? "text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}
                      style={isMe ? { background: "linear-gradient(135deg, #0d9488, #0f766e)" } : {}}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {(isTyping || spaceTypingActive) && <ChatTypingBubble />}

        </div>

        {/* Send error */}
        {sendError && (
          <div className="mx-4 mb-1 px-3 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-2">
            <p className="text-xs text-red-600">{sendError}</p>
            <button onClick={() => setSendError(null)} className="text-red-400 hover:text-red-600 shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="shrink-0 px-4 py-3 border-t border-gray-100">
          <form
            onSubmit={handleSendSubmit}
            className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-400/30 transition"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none disabled:cursor-not-allowed"
              disabled={sending}
              autoComplete="off"
              enterKeyHint="send"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}
