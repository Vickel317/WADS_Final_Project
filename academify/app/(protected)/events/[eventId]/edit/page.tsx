import { notFound, redirect } from "next/navigation";
import EventFormPage from "@/components/event-form-page";
import { getSession } from "@/lib/get-session";
import { eventToFormState } from "@/lib/event-form-utils";
import { prisma } from "@/lib/prisma";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { eventId } = await params;
  if (!eventId) notFound();

  const event = await prisma.event.findUnique({
    where: { eventID: eventId },
    select: {
      eventID: true,
      creatorID: true,
      title: true,
      description: true,
      dateTime: true,
      location: true,
      forumID: true,
    },
  });

  if (!event) notFound();
  if (event.creatorID !== session.user.userId) {
    redirect(`/events/${eventId}`);
  }

  const initialValues = eventToFormState(event);

  return (
    <EventFormPage
      mode="edit"
      eventId={event.eventID}
      initialValues={initialValues}
      heading="Edit Event"
      subheading="Update the details for your event."
      submitLabel="Save Changes"
      cancelHref={`/events/${event.eventID}`}
    />
  );
}
