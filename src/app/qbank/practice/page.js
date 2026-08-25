"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import QuestionSolver from "@/components/QuestionSolver";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

const DIFFICULTY_OPTIONS = [
  { key: "any", label: "Any" },
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
  { key: "very_hard", label: "Very Hard" },
];

const STATUS_OPTIONS = [
  { key: "new", label: "New" },
  { key: "incorrect", label: "Incorrect" },
  { key: "weak", label: "Weak" },
  { key: "bookmarked", label: "Bookmarked" },
  { key: "need_revision", label: "Need Revision" },
  { key: "mastered", label: "Mastered" },
];

const TIME_OPTIONS = [
  { key: 0, label: "Untimed" },
  { key: 10, label: "10 min" },
  { key: 20, label: "20 min" },
  { key: 30, label: "30 min" },
];

function toggleInArray(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function PracticeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeCourse } = useCourse();
  const autoStart = searchParams.get("auto") === "1";

  const [subjects, setSubjects] = useState([]);
  const [subjectDetail, setSubjectDetail] = useState(null);

  const [subject, setSubject] = useState(searchParams.get("subject") || "");
  const [chapter, setChapter] = useState(searchParams.get("chapter") || "");
  const [topics, setTopics] = useState(searchParams.get("topic") ? [searchParams.get("topic")] : []);
  const [count, setCount] = useState(Number(searchParams.get("count")) || 20);
  const [customCount, setCustomCount] = useState("");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "any");
  const [statuses, setStatuses] = useState(searchParams.get("status") ? searchParams.get("status").split(",").filter(Boolean) : []);
  const [timeMinutes, setTimeMinutes] = useState(Number(searchParams.get("time")) || 0);

  const [questions, setQuestions] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  // Auto-start (Smart Practice one-tap buttons) skips the form initially, but
  // a zero-result or failed session falls back to it so the student isn't
  // stuck on a dead end with no way to broaden their filters.
  const [showForm, setShowForm] = useState(!autoStart);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api.get(`/subjects/${params.toString() ? `?${params.toString()}` : ""}`).then(setSubjects).catch(() => {});
  }, [activeCourse?.id]);

  useEffect(() => {
    setChapter("");
    setTopics([]);
    if (!subject) {
      setSubjectDetail(null);
      return;
    }
    const match = subjects.find((s) => String(s.id) === String(subject) || s.slug === subject);
    if (match) {
      const params = new URLSearchParams();
      if (activeCourse?.id) params.set("course", activeCourse.id);
      api.get(`/subjects/${match.slug}/${params.toString() ? `?${params.toString()}` : ""}`).then(setSubjectDetail).catch(() => {});
    }
  }, [subject]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedChapter = subjectDetail?.chapters?.find((c) => String(c.id) === String(chapter));

  async function startPractice(e) {
    e?.preventDefault();
    setStarting(true);
    setError("");
    try {
      const payload = {
        count: customCount ? Number(customCount) : count,
        difficulty,
        status: statuses,
      };
      if (activeCourse?.id) payload.course = activeCourse.id;
      if (subject) payload.subject = subject;
      if (chapter) payload.chapter = chapter;
      if (topics.length) payload.topics = topics.map(Number);
      const data = await api.post("/questions/practice-session/", payload);
      setQuestions(data);
      if (data.length === 0) setShowForm(true);
    } catch {
      setError("Couldn't start this practice session. Please try again.");
      setShowForm(true);
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    if (autoStart && questions === null && !starting && !error) startPractice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  if (questions?.length > 0) {
    return (
      <div className="hm-app-shell">
        <Header title="Practice" showBack />
        <QuestionSolver
          questions={questions}
          finishLabel="Done"
          timeLimitMinutes={timeMinutes || undefined}
          onFinish={() => router.push("/qbank")}
        />
      </div>
    );
  }

  return (
    <AppShell>
      <Header title="Create Practice" showBack />
      <div className="hm-page-narrow flex flex-col gap-4">
        {(starting || (autoStart && questions === null && !error)) && (
          <p className="text-sm text-[var(--color-text-muted)]">Building your practice session…</p>
        )}

        {error && (
          <div className="hm-card p-4">
            <p className="text-sm text-brand-red">{error}</p>
            <button type="button" onClick={startPractice} className="mt-2 text-xs font-bold text-brand-blue">
              Try again
            </button>
          </div>
        )}

        {questions?.length === 0 && (
          <div className="hm-card p-5 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">No questions found</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              No questions matched these filters yet. Try a wider selection below.
            </p>
          </div>
        )}

        {showForm && (
          <form onSubmit={startPractice} className="flex flex-col gap-4">
            <div className="hm-card p-4">
              <p className="mb-3 text-sm font-bold text-[var(--color-text)]">What do you want to practice?</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Subject</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="hm-input">
                    <option value="">All Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Chapter</label>
                  <select
                    value={chapter}
                    onChange={(e) => { setChapter(e.target.value); setTopics([]); }}
                    className="hm-input"
                    disabled={!subjectDetail?.chapters?.length}
                  >
                    <option value="">All Chapters</option>
                    {subjectDetail?.chapters?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="hm-input">
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedChapter?.topics?.length > 0 && (
                <div className="mt-3">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                    Topics (optional — select one or more)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedChapter.topics.map((t) => {
                      const active = topics.includes(String(t.id));
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTopics((prev) => toggleInArray(prev, String(t.id)))}
                          aria-pressed={active}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            active ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                          }`}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="hm-card p-4">
              <p className="mb-1 text-sm font-bold text-[var(--color-text)]">Question Status</p>
              <p className="mb-3 text-xs text-[var(--color-text-muted)]">Leave blank for any status.</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((s) => {
                  const active = statuses.includes(s.key);
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setStatuses((prev) => toggleInArray(prev, s.key))}
                      aria-pressed={active}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hm-card p-4">
              <p className="mb-3 text-sm font-bold text-[var(--color-text)]">How do you want to practice?</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                    Number of Questions
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[10, 20, 50].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => { setCount(n); setCustomCount(""); }}
                        aria-pressed={!customCount && count === n}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                          !customCount && count === n ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="Custom"
                      value={customCount}
                      onChange={(e) => setCustomCount(e.target.value)}
                      className="hm-input w-24"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Time</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TIME_OPTIONS.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setTimeMinutes(t.key)}
                        aria-pressed={timeMinutes === t.key}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                          timeMinutes === t.key ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={starting}
              className="sticky bottom-3 w-full rounded-xl bg-brand-blue py-3 text-sm font-bold text-white shadow-md disabled:opacity-60"
            >
              {starting ? "Starting…" : "Start Practice"}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}

export default function PracticePage() {
  return (
    <RequireAuth>
      <PracticeContent />
    </RequireAuth>
  );
}
