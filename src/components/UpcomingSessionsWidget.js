"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const STATUS_LABELS = {
  scheduled: "Upcoming",
  registration_open: "Registration Open",
  live: "Live Now",
};

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Rescheduled exams surface here rather than in the main test-listing grids
 * — their underlying Test row is marked is_draft once adopted into a
 * template, so this is the only place a student sees "Session 2" etc. */
export default function UpcomingSessionsWidget() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    api
      .get("/exam-sessions/?upcoming=true")
      .then(setSessions)
      .catch(() => {});
  }, []);

  if (sessions.length === 0) return null;

  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        Upcoming Exam Sessions
      </p>
      <div className="hm-scrollbar-none flex gap-3 overflow-x-auto pb-1">
        {sessions.map((s) => (
          <Link key={s.id} href={`/tests/session/${s.id}`} className="hm-card w-64 flex-none p-4">
            <p className="truncate text-sm font-bold text-[var(--color-text)]">{s.exam_template_title}</p>
            <p className="text-xs font-semibold text-brand-blue">{s.session_name}</p>
            <div className="mt-2 flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
              <span>📅 {formatDate(s.start_datetime)}</span>
              <span>⏰ {formatTime(s.start_datetime)}</span>
              <span>⏱ {s.duration_minutes} Minutes</span>
              <span>📝 {s.question_count} Questions</span>
              <span>🎯 {s.total_marks} Marks</span>
            </div>
            <span className="mt-3 inline-block rounded-md bg-brand-green-light px-2 py-0.5 text-[10px] font-bold text-brand-green">
              {STATUS_LABELS[s.status] || s.status}
            </span>
            <span className="mt-2 block text-center text-xs font-bold text-brand-blue">View Details →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
