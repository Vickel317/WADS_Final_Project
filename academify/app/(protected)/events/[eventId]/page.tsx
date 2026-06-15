import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import EventActions from "./event-actions";
import EventBannerUpload from "@/components/event-banner-upload";

const DEFAULT_DURATION_MINUTES = 60;

const findEventLink = (value: string) => {
	const match = value.match(/https?:\/\/[^\s]+/i);
	return match ? match[0] : null;
};

const stripCategoryPrefix = (title: string) => {
	const match = title.match(/^\[(.+?)\]\s*(.+)$/);
	return match ? match[2] : title;
};

export default async function EventDetailPage({
	params,
}: {
	params: Promise<{ eventId: string }>;
}) {
	const session = await getSession();
	if (!session) redirect("/login");

	const resolvedParams = await params;
	const eventId = resolvedParams?.eventId ?? "";
	if (!eventId) notFound();

	const event = await prisma.event.findUnique({
		where: { eventID: eventId },
		include: {
			creator: { select: { userId: true, name: true, username: true } },
			attendees: {
				include: { user: { select: { userId: true, name: true, username: true } } },
			},
			forum: { select: { forumID: true, name: true } },
		},
	});

	if (!event) notFound();

	const attendeeUsers = event.attendees
		.map((attendee) => attendee.user)
		.filter(Boolean);
	const attendeeCount = attendeeUsers.length;
	const isHost = session.user.userId === event.creatorID;
	const isAttending = event.attendees.some(
		(attendee) => attendee.userID === session.user.userId
	);
	const startsAt = new Date(event.dateTime);
	const endsAt = new Date(startsAt.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
	const now = new Date();
	const statusLabel = now < startsAt ? "Upcoming" : now <= endsAt ? "Live Now" : "Past";
	const statusTone =
		statusLabel === "Live Now"
			? "bg-rose-50 text-rose-700"
			: statusLabel === "Upcoming"
				? "bg-emerald-50 text-emerald-700"
				: "bg-gray-100 text-gray-600";
	const eventLink = findEventLink(`${event.location} ${event.description}`);
	const displayTitle = stripCategoryPrefix(event.title);

	return (
		<div className="space-y-6">
			<div
				className="relative h-48 rounded-2xl overflow-hidden"
				style={{ background: "linear-gradient(135deg, #065f46, #059669, #10b981)" }}
			>
				<div className="absolute inset-0 bg-black/20" />
				<EventBannerUpload eventId={eventId} isHost={isHost} />
				<div className="absolute bottom-4 left-6 right-6">
					<div className="flex flex-wrap items-center gap-2 text-xs text-white/80 mb-2">
						<Link
							href="/forums"
							className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 font-medium text-white"
						>
							{event.forum.name}
						</Link>
						<span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone}`}>
							{statusLabel}
						</span>
						<span>•</span>
						<span>
							{formatDistanceToNow(new Date(event.dateTime), { addSuffix: true })}
						</span>
					</div>
					<h1 className="text-2xl font-bold text-white">{displayTitle}</h1>
				</div>
			</div>

			<div className="rounded-2xl border border-gray-100 bg-white p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-2">
						<p className="text-sm text-gray-600">{event.description}</p>
						<div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
							<span>
								Host: <span className="font-medium text-gray-700">{event.creator.name}</span>
							</span>
							<span>•</span>
							<span>{event.location}</span>
						</div>
					</div>
					<EventActions
						eventId={event.eventID}
						isHost={isHost}
						isAttending={isAttending}
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="rounded-2xl border border-gray-100 bg-white p-6 lg:col-span-2">
					<h2 className="text-sm font-semibold text-gray-700">Participants</h2>
					<p className="mt-1 text-xs text-gray-400">
						{attendeeCount} participant{attendeeCount === 1 ? "" : "s"}
					</p>
					<div className="mt-4 grid gap-3 sm:grid-cols-2">
						{attendeeUsers.length === 0 ? (
							<p className="text-sm text-gray-400">No one has joined yet.</p>
						) : (
							attendeeUsers.map((user) => (
								<div
									key={user.userId}
									className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2"
								>
									<div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
										{user.name.slice(0, 1).toUpperCase()}
									</div>
									<div className="min-w-0">
										<p className="text-sm font-medium text-gray-700">{user.name}</p>
										<p className="text-xs text-gray-400 truncate">@{user.username}</p>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				<div className="space-y-4">
					<div className="rounded-2xl border border-gray-100 bg-white p-6">
						<h2 className="text-sm font-semibold text-gray-700">Event Host</h2>
						<div className="mt-4 flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
								{event.creator.name.slice(0, 1).toUpperCase()}
							</div>
							<div>
								<p className="text-sm font-medium text-gray-700">{event.creator.name}</p>
								<Link
									href={`/profile/${event.creator.userId}`}
									className="text-xs text-teal-600 hover:underline"
								>
									View profile
								</Link>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-gray-100 bg-white p-6">
						<h2 className="text-sm font-semibold text-gray-700">Details</h2>
						<div className="mt-3 space-y-2 text-sm text-gray-600">
							<div className="flex items-center justify-between">
								<span>Date</span>
								<span className="font-medium text-gray-700">
									{new Date(event.dateTime).toLocaleString()}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span>Status</span>
								<span className="font-medium text-gray-700">
									{statusLabel}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span>Participants</span>
								<span className="font-medium text-gray-700">{attendeeCount}</span>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-gray-100 bg-white p-6">
						<h2 className="text-sm font-semibold text-gray-700">Virtual Link</h2>
						<p className="mt-2 text-sm text-gray-600">
							{eventLink ? (
								<a href={eventLink} className="text-teal-600 hover:underline">
									{eventLink}
								</a>
							) : (
								"No virtual link provided."
							)}
						</p>
						{isHost && !eventLink && (
							<p className="mt-2 text-xs text-gray-400">
								Add a Zoom or Meet link in the event location or description to show it here.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
