import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

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
      take: 5,
      select: { eventID: true, title: true, dateTime: true, location: true },
    }),
    prisma.file.findMany({
      where: { uploadedByID: userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { fileID: true, fileName: true, updatedAt: true, spaceID: true },
    }),
    prisma.collabSpace.findMany({
      where: { members: { some: { userID: userId } } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { spaceID: true, name: true, forumID: true },
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
  ]);

  const conversationMap = new Map<
    string,
    { userId: string; name: string; lastMessage: string; lastAt: Date }
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
      });
    }
  }

  const recentChats = Array.from(conversationMap.values())
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your calendar, files, collab spaces, and chats — forums stay the main discussion hub.
          </p>
        </div>
        <Link
          href="/forums"
          className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
        >
          Browse forums
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Events joined", value: eventsJoinedCount },
          { label: "My uploads", value: filesUploadedCount },
          { label: "Collab spaces", value: collabSpacesCount },
          { label: "Connections", value: connectionsCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800">Upcoming events</h2>
          <p className="text-xs text-gray-500 mt-1">Events you joined</p>
          <ul className="mt-4 space-y-3">
            {upcomingEvents.length === 0 ? (
              <li className="text-sm text-gray-400">No upcoming events.</li>
            ) : (
              upcomingEvents.map((event) => (
                <li key={event.eventID}>
                  <Link
                    href={`/events/${event.eventID}`}
                    className="block rounded-xl border border-gray-50 p-3 hover:border-teal-200 transition"
                  >
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(event.dateTime), "PPp")} · {event.location}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link href="/events" className="mt-3 inline-block text-xs font-medium text-teal-600 hover:underline">
            View all events
          </Link>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800">Recent chats</h2>
          <p className="text-xs text-gray-500 mt-1">Latest conversations</p>
          <ul className="mt-4 space-y-3">
            {recentChats.length === 0 ? (
              <li className="text-sm text-gray-400">No messages yet.</li>
            ) : (
              recentChats.map((chat) => (
                <li key={chat.userId}>
                  <Link
                    href={`/messages/${chat.userId}`}
                    className="block rounded-xl border border-gray-50 p-3 hover:border-teal-200 transition"
                  >
                    <p className="text-sm font-medium text-gray-900">{chat.name}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{chat.lastMessage}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDistanceToNow(chat.lastAt, { addSuffix: true })}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link href="/messages" className="mt-3 inline-block text-xs font-medium text-teal-600 hover:underline">
            Open messages
          </Link>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800">My recent uploads</h2>
          <ul className="mt-4 space-y-3">
            {recentFiles.length === 0 ? (
              <li className="text-sm text-gray-400">No files uploaded yet.</li>
            ) : (
              recentFiles.map((file) => (
                <li key={file.fileID} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-gray-800">{file.fileName}</span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDistanceToNow(file.updatedAt, { addSuffix: true })}
                  </span>
                </li>
              ))
            )}
          </ul>
          <Link href="/files" className="mt-3 inline-block text-xs font-medium text-teal-600 hover:underline">
            My uploads library
          </Link>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800">Collab spaces</h2>
          <ul className="mt-4 space-y-3">
            {collabSpaces.length === 0 ? (
              <li className="text-sm text-gray-400">No collab spaces yet.</li>
            ) : (
              collabSpaces.map((space) => (
                <li key={space.spaceID}>
                  <Link
                    href={`/collaboration/${space.spaceID}`}
                    className="block rounded-xl border border-gray-50 p-3 hover:border-teal-200 transition"
                  >
                    <p className="text-sm font-medium text-gray-900">{space.name}</p>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link href="/collaboration" className="mt-3 inline-block text-xs font-medium text-teal-600 hover:underline">
            All collab spaces
          </Link>
        </section>
      </div>
    </div>
  );
}
