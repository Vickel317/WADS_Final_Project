"use client";

import EventFormPage from "@/components/event-form-page";

export default function NewEventPage() {
  return (
    <EventFormPage
      mode="create"
      heading="Create Event"
      subheading="Schedule a study session, workshop, or meetup for your community."
      submitLabel="Create Event"
      cancelHref="/events"
    />
  );
}
