"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { getSocket } from "@/lib/socket-client";
import { authClient } from "@/lib/auth-client";
import type { ChatMessage } from "@/socket-server/index";
import NewMessageModal from "@/components/new-message-modal";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface Conversation {
  userId: string;
  name: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export default function ConversationPage() {
  const { userId: partnerId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const myId = session?.user?.id ?? "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [partnerName, setPartnerName] = useState(partnerId);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMessageAt = useRef<string | null>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load conversation list
  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((data) => setConversations(data.conversations ?? []))
      .catch(() => {});
  }, []);

  // Load messages for this conversation
  const loadMessages = useCallback(
    async (since?: string) => {
      try {
        const url = since
          ? `/api/messages/${partnerId}?since=${encodeURIComponent(since)}`
          : `/api/messages/${partnerId}`;
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
      } catch {
        // ignore
      } finally {
        setLoadingMsgs(false);
      }
    },
    [partnerId]
  );

  useEffect(() => {
    if (!partnerId) return;
    setLoadingMsgs(true);
    setMessages([]);
    loadMessages();
  }, [partnerId, loadMessages]);

  // Resolve partner name from conversation list
  useEffect(() => {
    const conv = conversations.find((c) => c.userId === partnerId);
    if (conv) setPartnerName(conv.name);
  }, [conversations, partnerId]);

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
      // Catch-up: fetch messages missed while disconnected
      if (lastMessageAt.current) {
        loadMessages(lastMessageAt.current);
      }
      socket.emit("check_online", partnerId, (online: boolean) => {
        setPartnerOnline(online);
      });
    }

    function onNewMessage(msg: ChatMessage) {
      if (msg.senderId !== partnerId && msg.receiverId !== partnerId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        lastMessageAt.current = msg.createdAt;
        return [...prev, msg];
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.userId === partnerId
            ? { ...c, lastMessage: msg.content, lastAt: msg.createdAt, unread: 0 }
            : c
        )
      );
    }

    function onTyping({ from }: { from: string }) {
      if (from === partnerId) setIsTyping(true);
    }

    function onStopTyping({ from }: { from: string }) {
      if (from === partnerId) setIsTyping(false);
    }

    // Register listeners BEFORE connecting so no events are missed
    socket.on("connect", onConnect);
    socket.on("authenticated", onAuthenticated);
    socket.on("new_message", onNewMessage);
    socket.on("typing", onTyping);
    socket.on("stop_typing", onStopTyping);

    // Connect (or authenticate immediately if already connected)
    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit("authenticate", myId);
    }

    // Initial online check (may arrive before authenticated fires)
    socket.emit("check_online", partnerId, (online: boolean) => {
      setPartnerOnline(online);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("authenticated", onAuthenticated);
      socket.off("new_message", onNewMessage);
      socket.off("typing", onTyping);
      socket.off("stop_typing", onStopTyping);
    };
  }, [myId, partnerId, loadMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
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
    if (!myId) {
      setSendError("Session not ready — please wait a moment and try again.");
      return;
    }
    setSendError(null);
    setSending(true);
    setInput("");
    if (typingTimer.current) clearTimeout(typingTimer.current);
    getSocket().emit("stop_typing", { to: partnerId });

    try {
      const res = await fetch(`/api/messages/${partnerId}`, {
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

      // Relay to recipient in real-time
      getSocket().emit("send_message", saved);

      setConversations((prev) => {
        const filtered = prev.filter((c) => c.userId !== partnerId);
        const existing = prev.find((c) => c.userId === partnerId);
        return [
          {
            userId: partnerId,
            name: existing?.name ?? partnerName,
            lastMessage: saved.content,
            lastAt: saved.createdAt,
            unread: 0,
          },
          ...filtered,
        ];
      });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send message");
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConvs = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
    {showNewMessage && <NewMessageModal onClose={() => setShowNewMessage(false)} />}
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Sidebar — conversation list */}
      <div className="hidden lg:flex w-72 shrink-0 border-r border-gray-100 flex-col">
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

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredConvs.map((conv) => {
            const isActive = conv.userId === partnerId;
            return (
              <button
                key={conv.userId}
                onClick={() => router.push(`/messages/${conv.userId}`)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition text-left ${isActive ? "bg-teal-50" : "hover:bg-gray-50"}`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm font-semibold truncate ${isActive ? "text-teal-700" : "text-gray-900"}`}>
                      {conv.name}
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
          })}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
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
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              {partnerOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{partnerName}</p>
              <p className={`text-xs font-medium ${partnerOnline ? "text-green-500" : "text-gray-400"}`}>
                {isTyping ? "typing…" : partnerOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mb-5">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
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

          {isTyping && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
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
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-400/30 transition">
            <input
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={sessionLoading ? "Connecting…" : "Type a message…"}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none disabled:cursor-not-allowed"
              disabled={sending || sessionLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending || sessionLoading}
              title={sessionLoading ? "Connecting to session…" : undefined}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
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
    </>
  );
}
