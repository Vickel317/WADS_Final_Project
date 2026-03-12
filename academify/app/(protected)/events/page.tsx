"use client";

import { useState } from "react";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";


interface Event {
  id: string;
  title: string;
  type: "Study Session" | "Workshop" | "Seminar" | "Social";
  date: string;
  time: string;
  location: string;
  host: string;
  participants: number;
  maxParticipants: number;
  joined?: boolean;
}


const EVENTS: Event[] = [
  {
    id: "1",
    title: "Machine Learning Study Group",
    type: "Study Session",
    date: "Today, Feb 24",
    time: "4:00 PM - 6:00 PM",
    location: "Library Room 203",
    host: "Sarah Chen",
    participants: 8,
    maxParticipants: 12,
  },
  {
    id: "2",
    title: "Web Development Workshop",
    type: "Workshop",
    date: "Tomorrow, Feb 25",
    time: "2:00 PM - 4:30 PM",
    location: "CS Building Lab 1",
    host: "Mike Johnson",
    participants: 15,
    maxParticipants: 20,
  },
  {
    id: "3",
    title: "Final Exam Prep - Calculus",
    type: "Study Session",
    date: "Feb 26",
    time: "10:00 AM - 12:00 PM",
    location: "Online (Zoom)",
    host: "Prof. Williams",
    participants: 22,
    maxParticipants: 30,
  },
  {
    id: "4",
    title: "Data Structures Review",
    type: "Study Session",
    date: "Feb 27",
    time: "3:00 PM - 5:00 PM",
    location: "Room B204",
    host: "Alex Turner",
    participants: 6,
    maxParticipants: 10,
  },
  {
    id: "5",
    title: "UI/UX Design Seminar",
    type: "Seminar",
    date: "Feb 28",
    time: "1:00 PM - 3:00 PM",
    location: "Auditorium A",
    host: "Design Club",
    participants: 40,
    maxParticipants: 60,
  },
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const TYPE_STYLES: Record<Event["type"], { badge: string; border: string }> = {
  "Study Session": {
    badge: "bg-teal-500 text-white",
    border: "border-teal-200",
  },
  Workshop: { badge: "bg-indigo-500 text-white", border: "border-indigo-200" },
  Seminar: { badge: "bg-amber-500 text-white", border: "border-amber-200" },
  Social: { badge: "bg-pink-500 text-white", border: "border-pink-200" },
};


function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];


function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-5 px-4">
      <span className="text-3xl font-bold text-gray-900">{value}</span>
      <span className="text-sm text-gray-400 mt-1">{label}</span>
    </div>
  );
}

function EventCard({
  event,
  onJoin,
}: {
  event: Event;
  onJoin: (id: string) => void;
}) {
  const styles = TYPE_STYLES[event.type];
  const full = event.participants >= event.maxParticipants;

  return (
    <div
      className={`bg-white rounded-xl border ${styles.border} p-4 hover:shadow-sm transition-shadow`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${styles.badge}`}
            >
              {event.type}
            </span>
            <span className="text-base font-semibold text-gray-900 truncate">
              {event.title}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar size={12} className="shrink-0" />
              {event.date}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={12} className="shrink-0" />
              {event.time}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin size={12} className="shrink-0" />
              {event.location}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">
                {event.host[0]}
              </div>
              <span>by {event.host}</span>
              <Users size={11} className="ml-1 shrink-0" />
              <span>
                {event.participants}/{event.maxParticipants} participants
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => !full && onJoin(event.id)}
          disabled={event.joined}
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            event.joined
              ? "bg-gray-100 text-gray-400 cursor-default"
              : full
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "text-white hover:opacity-90"
          }`}
          style={
            !event.joined && !full ? { backgroundColor: "#0d9488" } : undefined
          }
        >
          {event.joined ? "Joined" : full ? "Full" : "Join"}
        </button>
      </div>

      {/* Participants bar */}
      <div className="mt-3">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{
              width: `${(event.participants / event.maxParticipants) * 100}%`,
              backgroundColor: "#0d9488",
            }}
          />
        </div>
      </div>
    </div>
  );
}


function CreateEventModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Create Event</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Event Title
            </label>
            <input
              placeholder="e.g. Algorithms Study Group"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Type
            </label>
            <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500 bg-white">
              <option>Study Session</option>
              <option>Workshop</option>
              <option>Seminar</option>
              <option>Social</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Date
              </label>
              <input
                type="date"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Time
              </label>
              <input
                type="time"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Location
            </label>
            <input
              placeholder="e.g. Library Room 203 or Online (Zoom)"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Max Participants
            </label>
            <input
              type="number"
              placeholder="e.g. 20"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="What will you cover?"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "#0d9488" }}
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
}


export default function EventsPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [modal, setModal] = useState(false);
  const [events, setEvents] = useState<Event[]>(EVENTS);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const handleJoin = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, joined: true, participants: e.participants + 1 }
          : e
      )
    );
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Study Sessions &amp; Events
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Organize and join study sessions with your peers
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "#0d9488" }}
        >
          <Plus size={16} /> Create Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard value={23} label="Events Attended" />
        <StatCard value={8} label="Events Organized" />
        <StatCard value={5} label="Upcoming" />
        <StatCard value={142} label="Total Hours" />
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Calendar */}
        <div className="w-full lg:w-64 lg:shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Calendar</p>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={prevMonth}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-semibold text-gray-800">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                onClick={nextMonth}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-medium text-gray-400 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday =
                  day === today.getDate() &&
                  viewMonth === today.getMonth() &&
                  viewYear === today.getFullYear();
                return (
                  <button
                    key={day}
                    className="w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium text-gray-700 transition-all duration-150 hover:text-white"
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#0d9488"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ""; }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* This week summary */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                Upcoming This Week
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                  3 events
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  2 workshops
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming events */}
        <div className="flex-1 min-w-0 w-full">
          <p className="text-sm font-semibold text-gray-700 mb-3">Upcoming</p>
          <div className="space-y-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} onJoin={handleJoin} />
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && <CreateEventModal onClose={() => setModal(false)} />}
    </div>
  );
}
