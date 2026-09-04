"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { ErrorCard } from "@/components/subscription/billingShared";
import { api } from "@/lib/api";

const STATUS_LABELS = {
  draft: "Not yet open",
  scheduled: "Upcoming",
  registration_open: "Registration Open",
  live: "Live",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDateTime(value) {
  return new Date(value).toLocaleString("en-US", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function SessionContent() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  // Previously had no .catch() — a failed request left the page on a bare
  // "Loading…" forever.
  function load() {
    api
      .get(`/exam-sessions/${sessionId}/`)
      .then((data) => {
        setSession(data);
        setLoadError(false);
      })
      .catch(() => setLoadError(true));
  }

  useEffect(load, [sessionId]);

  async function startExam() {
    setStarting(true);
    setError("");
    try {
      const attempt = await api.post(
        `/exam-sessions/${sessionId}/start/`,
        needsPassword ? { access_password: password } : {}
      );
      router.push(`/tests/attempt/${attempt.id}`);
    } catch (err) {
      if (err.status === 403 && /password/i.test(err.message)) {
        setNeedsPassword(true);
        setError(password ? "Incorrect password." : "This session is password-protected.");
      } else {
        setError(err.message);
      }
    } finally {
      setStarting(false);
    }
  }

  if (loadError) {
    return (
      <AppShell>
        <Header title="Exam Session" showBack />
        <div className="hm-page-narrow py-6">
          <ErrorCard title="Unable to load this session." onRetry={load} />
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell>
        <Header title="Exam Session" showBack />
        <div className="hm-page-narrow flex flex-col gap-4 py-6">
          <div className="hm-card animate-pulse p-5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-16 rounded bg-[var(--color-surface-muted)]" />
            </div>
            <div className="mt-3 h-3 w-1/2 rounded bg-[var(--color-surface-muted)]" />
            <div className="mt-4 h-16 w-full rounded-xl bg-[var(--color-surface-muted)]" />
            <div className="mt-4 h-11 w-full rounded-xl bg-[var(--color-surface-muted)]" />
          </div>
        </div>
      </AppShell>
    );
  }

  const now = new Date();
  const notStarted = now < new Date(session.start_datetime);
  const ended = now > new Date(session.end_datetime) || session.status === "completed";
  const cancelled = session.status === "cancelled";
  const canStart = !notStarted && !ended && !cancelled;

  return (
    <AppShell>
      <Header title={session.exam_template_title} showBack />
      <div className="hm-page-narrow flex flex-col gap-4 py-6">
        <div className="hm-card p-5">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-[var(--color-text)]">{session.exam_template_title}</h1>
            <span className="rounded-md bg-brand-blue/10 px-2 py-1 text-[10px] font-bold text-brand-blue">
              {STATUS_LABELS[session.status] || session.status}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-brand-blue">{session.session_name}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{formatDateTime(session.start_datetime)}</p>
          {session.exam_code && <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">Exam ID: {session.exam_code}</p>}

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[var(--color-surface-muted)] p-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-[var(--color-text-muted)]">Duration</p>
              <p className="font-bold text-[var(--color-text)]">{session.duration_minutes} mins</p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)]">Questions</p>
              <p className="font-bold text-[var(--color-text)]">{session.question_count}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)]">Total marks</p>
              <p className="font-bold text-[var(--color-text)]">{session.total_marks}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)]">Negative marking</p>
              <p className="font-bold text-[var(--color-text)]">{session.negative_marking ? "Yes" : "No"}</p>
            </div>
          </div>

          {cancelled && (
            <p className="mt-4 rounded-lg bg-brand-red-light px-3 py-2 text-xs font-medium text-brand-red">
              This session has been cancelled.
            </p>
          )}
          {!cancelled && notStarted && (
            <p className="mt-4 rounded-lg bg-brand-blue/10 px-3 py-2 text-xs font-medium text-brand-blue">
              This session starts on {formatDateTime(session.start_datetime)} — check back then.
            </p>
          )}
          {!cancelled && !notStarted && ended && (
            <p className="mt-4 rounded-lg bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-medium text-[var(--color-text-muted)]">
              This session has ended.
            </p>
          )}

          {needsPassword && canStart && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Session password"
              className="hm-input mt-4"
            />
          )}

          {error && <p className="mt-3 text-xs font-medium text-brand-red">{error}</p>}

          {canStart && (
            <button
              onClick={startExam}
              disabled={starting}
              className="mt-4 w-full rounded-xl bg-brand-blue py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {starting ? "Starting…" : "Start Exam"}
            </button>
          )}

          <Link href={`/tests/history?session=${sessionId}`} className="mt-3 block text-center text-xs font-bold text-brand-blue">
            View results for this session →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

export default function SessionPage() {
  return (
    <RequireAuth>
      <SessionContent />
    </RequireAuth>
  );
}
