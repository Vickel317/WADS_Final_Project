import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

const fileIconColor: Record<string, { bg: string; text: string }> = {
  pdf: { bg: "bg-red-100", text: "text-red-600" },
  zip: { bg: "bg-yellow-100", text: "text-yellow-700" },
  pptx: { bg: "bg-purple-100", text: "text-purple-600" },
  png: { bg: "bg-blue-100", text: "text-blue-600" },
  jpg: { bg: "bg-blue-100", text: "text-blue-600" },
  jpeg: { bg: "bg-blue-100", text: "text-blue-600" },
  docx: { bg: "bg-indigo-100", text: "text-indigo-600" },
  doc: { bg: "bg-indigo-100", text: "text-indigo-600" },
};

function getFileIconColor(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return fileIconColor[ext] ?? { bg: "bg-gray-100", text: "text-gray-500" };
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.user.userId;
  const now = new Date();

  const [
    eventsJoinedCount,
    filesUploadedCount,
    collabSpacesCount,
    connectionsCount,
    upcomingEvents,
    recentFiles,
    collabSpaces,
    recentMessages,
    user,
  ] = await Promise.all([
    prisma.eventAttendee.count({ where: { userID: userId } }),
    prisma.file.count({ where: { uploadedByID: userId } }),
    prisma.spaceMember.count({ where: { userID: userId } }),
    prisma.follow.count({
      where: {
        OR: [{ followerId: userId }, { followingId: userId }],
      },
    }),
    prisma.event.findMany({
      where: {
        attendees: { some: { userID: userId } },
        dateTime: { gte: now },
      },
      orderBy: { dateTime: "asc" },
      take: 4,
      select: {
        eventID: true,
        title: true,
        dateTime: true,
        location: true,
        forum: { select: { name: true } },
      },
    }),
    prisma.file.findMany({
      where: { uploadedByID: userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { fileID: true, fileName: true, fileType: true, fileSize: true, updatedAt: true },
    }),
    prisma.collabSpace.findMany({
      where: { members: { some: { userID: userId } } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        spaceID: true,
        name: true,
        forum: { select: { name: true } },
        _count: { select: { members: true } },
      },
    }),
    prisma.message.findMany({
      where: { OR: [{ senderID: userId }, { receiverID: userId }] },
      orderBy: { sentAt: "desc" },
      take: 40,
      include: {
        sender: { select: { userId: true, name: true } },
        receiver: { select: { userId: true, name: true } },
      },
    }),
    prisma.user.findUnique({
      where: { userId },
      select: { name: true, role: true },
    }),
  ]);

  const conversationMap = new Map<
    string,
    { userId: string; name: string; lastMessage: string; lastAt: Date; unread: boolean }
  >();

  for (const message of recentMessages) {
    const partnerId =
      message.senderID === userId ? message.receiverID : message.senderID;
    const partnerName =
      message.senderID === userId
        ? message.receiver.name
        : message.sender.name;
    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        userId: partnerId,
        name: partnerName,
        lastMessage: message.content,
        lastAt: message.sentAt,
        unread: message.receiverID === userId && !message.read,
      });
    }
  }

  const recentChats = Array.from(conversationMap.values())
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime())
    .slice(0, 5);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const stats = [
    {
      label: "Events joined",
      value: eventsJoinedCount,
      href: "/events",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "My uploads",
      value: filesUploadedCount,
      href: "/files",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Collab spaces",
      value: collabSpacesCount,
      href: "/collaboration",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Connections",
      value: connectionsCount,
      href: "/connections",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Welcome banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ backgroundImage: "linear-gradient(135deg, #0f766e, #14b8a6, #06b6d4)" }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/20" />
          <div className="absolute -left-4 -bottom-4 w-28 h-28 rounded-full bg-white/15" />
        </div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/80">{greeting}</p>
          <h1 className="text-2xl font-bold mt-1">{user?.name ?? "Dashboard"}</h1>
          <p className="text-sm text-white/70 mt-2 max-w-lg">
            Your calendar, files, collab spaces, and chats — all in one place.
          </p>
        </div>
        <Link
          href="/forums"
          className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/25"
        >
          Browse forums
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming events */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <SectionHeader
            icon={
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="Upcoming events"
            subtitle="Events you RSVP'd to"
          />
          <ul className="mt-4 space-y-2">
            {upcomingEvents.length === 0 ? (
              <li className="py-8 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}
                >
                  <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">No upcoming events</p>
                <p className="text-xs text-gray-400 mt-1">Browse forums to find events</p>
              </li>
            ) : (
              upcomingEvents.map((event) => (
                <li key={event.eventID}>
                  <Link
                    href={`/events/${event.eventID}`}
                    className="group block rounded-xl border border-gray-50 p-3.5 transition hover:border-teal-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition truncate">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{format(new Date(event.dateTime), "EEE, MMM d · h:mm a")}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <span className="inline-block rounded-lg bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 uppercase">
                          {event.forum.name}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link
            href="/events"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline transition"
          >
            View all events
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>

        {/* Recent chats */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <SectionHeader
            icon={
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            title="Recent chats"
            subtitle="Your latest conversations"
          />
          <ul className="mt-4 space-y-2">
            {recentChats.length === 0 ? (
              <li className="py-8 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}
                >
                  <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Start a conversation from a profile</p>
              </li>
            ) : (
              recentChats.map((chat) => (
                <li key={chat.userId}>
                  <Link
                    href={`/messages/${chat.userId}`}
                    className="group flex items-center gap-3 rounded-xl border border-gray-50 p-3.5 transition hover:border-teal-200 hover:shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {chat.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition truncate">
                          {chat.name}
                        </p>
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {formatDistanceToNow(chat.lastAt, { addSuffix: false })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{chat.lastMessage}</p>
                    </div>
                    {chat.unread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                    )}
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link
            href="/messages"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline transition"
          >
            Open messages
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>

        {/* Recent uploads */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <SectionHeader
            icon={
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            }
            title="Recent uploads"
            subtitle="Files you've uploaded"
          />
          <ul className="mt-4 divide-y divide-gray-50">
            {recentFiles.length === 0 ? (
              <li className="py-8 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}
                >
                  <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">No files uploaded yet</p>
                <p className="text-xs text-gray-400 mt-1">Upload files in a collab space</p>
              </li>
            ) : (
              recentFiles.map((file) => {
                const iconColor = getFileIconColor(file.fileName);
                const ext = file.fileName.split(".").pop()?.toUpperCase() ?? "FILE";
                return (
                  <li key={file.fileID}>
                    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className={`w-9 h-9 rounded-lg ${iconColor.bg} ${iconColor.text} flex items-center justify-center shrink-0`}>
                        <span className="text-[10px] font-bold">{ext}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDistanceToNow(file.updatedAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
          <Link
            href="/files"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline transition"
          >
            My uploads library
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>

        {/* Collab spaces */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <SectionHeader
            icon={
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Collab spaces"
            subtitle="Your active workspaces"
          />
          <ul className="mt-4 space-y-2">
            {collabSpaces.length === 0 ? (
              <li className="py-8 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}
                >
                  <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">No collab spaces yet</p>
                <p className="text-xs text-gray-400 mt-1">Join a space from the collaboration page</p>
              </li>
            ) : (
              collabSpaces.map((space) => (
                <li key={space.spaceID}>
                  <Link
                    href={`/collaboration/${space.spaceID}`}
                    className="group block rounded-xl border border-gray-50 p-3.5 transition hover:border-teal-200 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition truncate">
                          {space.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{space.forum.name}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>{space._count.members}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link
            href="/collaboration"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline transition"
          >
            All collab spaces
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>
      </div>
    </div>
  );
}
