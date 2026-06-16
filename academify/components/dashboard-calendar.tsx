"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";

interface CalendarEvent {
  eventID: string;
  title: string;
  dateTime: string;
  location: string;
  forumName: string;
  forumSlug: string;
}

export default function DashboardCalendar({ events }: { events: CalendarEvent[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());





  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = format(new Date(event.dateTime), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const selectedEvents = selectedDate
    ? eventsByDate.get(format(selectedDate, "yyyy-MM-dd")) ?? []
    : [];

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:gap-5">
      {/* Left: selected day events */}
      <div className="min-w-0 flex-1">
        {selectedDate && (
          <>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-gray-900">
                {format(selectedDate, "d")}
              </span>
              <span className="text-sm font-medium text-gray-500">
                {format(selectedDate, "EEE, MMM yyyy")}
              </span>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No events on this day</p>
            ) : (
              <ul className="space-y-2">
                {selectedEvents.map((event) => (
                  <li key={event.eventID}>
                    <Link
                      href={`/events?forum=${event.forumSlug}`}
                      className="group block rounded-xl border border-gray-100 p-3 transition hover:border-teal-200 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition truncate">
                          {event.title}
                        </p>
                        <span className="inline-block shrink-0 rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 uppercase">
                          {event.forumName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {format(new Date(event.dateTime), "h:mm a")}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{event.location}</span>
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Right: mini calendar */}
      <div className="w-full shrink-0 sm:w-48">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 rounded hover:bg-gray-100 transition text-gray-500"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p className="text-xs font-semibold text-gray-700">
            {format(currentMonth, "MMM yyyy")}
          </p>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 rounded hover:bg-gray-100 transition text-gray-500"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-0.5">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[9px] font-semibold text-gray-400 uppercase py-0.5">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const hasEvents = eventsByDate.has(key);
            const inMonth = isSameMonth(d, currentMonth);
            const today = isToday(d);
            const selected = selectedDate && isSameDay(d, selectedDate);

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(d)}
                className={`
                  relative flex items-center justify-center py-1.5 text-[11px] transition
                  ${inMonth ? "bg-white hover:bg-teal-50" : "bg-gray-50 text-gray-300"}
                  ${selected ? "bg-teal-50 ring-1 ring-inset ring-teal-500 font-semibold text-teal-700" : ""}
                `}
              >
                <span
                  className={`
                    ${today && !selected ? "w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold" : ""}
                    ${!today ? (inMonth ? "text-gray-700" : "text-gray-300") : ""}
                  `}
                >
                  {format(d, "d")}
                </span>
                {hasEvents && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
