"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import RequireTeacher from "@/components/RequireTeacher";
import { api } from "@/lib/api";

const LESSON_TYPES = [
  { key: "video", label: "Video Lesson" },
  { key: "pdf", label: "PDF Lesson" },
  { key: "quiz", label: "MCQ Quiz Exam" },
  { key: "live_class", label: "Live Zoom Class" },
  { key: "notes", label: "Notes" },
];

const STATUS_STYLES = {
  approved: "bg-brand-green-light text-brand-green",
  rejected: "bg-brand-red-light text-brand-red",
  pending_review: "bg-yellow-100 text-yellow-700",
  draft: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
  archived: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
};

function AddLessonForm({ sectionId, onAdded, onCancel }) {
  const [lessonType, setLessonType] = useState("video");
  const [title, setTitle] = useState("");
  const [videoSearch, setVideoSearch] = useState("");
  const [videoResults, setVideoResults] = useState([]);
  const [videoId, setVideoId] = useState("");
  const [tests, setTests] = useState([]);
  const [testId, setTestId] = useState("");
  const [notesContent, setNotesContent] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lessonType !== "video") return;
    const t = setTimeout(() => {
      api.get(`/videos/?search=${encodeURIComponent(videoSearch)}`).then((data) => setVideoResults(data.results || data));
    }, 250);
    return () => clearTimeout(t);
  }, [lessonType, videoSearch]);

  useEffect(() => {
    if (lessonType !== "quiz") return;
    api.get("/tests/").then((data) => setTests(data.results || data));
  }, [lessonType]);

  async function submit() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await api.post("/course-lessons/", {
        section: sectionId,
        lesson_type: lessonType,
        title,
        video: lessonType === "video" ? videoId || null : null,
        test: lessonType === "quiz" ? testId || null : null,
        notes_content: lessonType === "notes" ? notesContent : "",
      });
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-dashed border-[var(--color-border)] p-3">
      <div className="grid grid-cols-2 gap-2">
        <select value={lessonType} onChange={(e) => setLessonType(e.target.value)} className="hm-input text-xs">
          {LESSON_TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson title" className="hm-input text-xs" />
      </div>

      {lessonType === "video" && (
        <div className="mt-2">
          <input
            value={videoSearch}
            onChange={(e) => setVideoSearch(e.target.value)}
            placeholder="Search existing videos…"
            className="hm-input text-xs"
          />
          <select value={videoId} onChange={(e) => setVideoId(e.target.value)} className="hm-input mt-2 text-xs">
            <option value="">— Select a video —</option>
            {videoResults.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {lessonType === "quiz" && (
        <select value={testId} onChange={(e) => setTestId(e.target.value)} className="hm-input mt-2 text-xs">
          <option value="">— Select a quiz/test —</option>
          {tests.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      )}

      {lessonType === "notes" && (
        <textarea
          value={notesContent}
          onChange={(e) => setNotesContent(e.target.value)}
          rows={3}
          placeholder="Notes content…"
          className="hm-input mt-2 text-xs"
        />
      )}

      {lessonType === "pdf" && (
        <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">PDF upload is added in a later step — create the lesson now, attach the file after.</p>
      )}
      {lessonType === "live_class" && (
        <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">Zoom scheduling is added in a later step — this reserves the lesson&apos;s place in the curriculum.</p>
      )}

      {error && <p className="mt-2 text-xs font-medium text-brand-red">{error}</p>}

      <div className="mt-2 flex gap-2">
        <button onClick={submit} disabled={saving} className="rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-bold text-white">
          {saving ? "Adding…" : "Add lesson"}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold">
          Cancel
        </button>
      </div>
    </div>
  );
}

function EditCourseContent() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingLessonTo, setAddingLessonTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.get(`/teacher-courses/${id}/`).then(setCourse);
  }

  useEffect(load, [id]);

  async function addSection() {
    if (!newSectionTitle.trim()) return;
    await api.post("/course-sections/", { course: id, title: newSectionTitle, order: (course.sections?.length || 0) + 1 });
    setNewSectionTitle("");
    load();
  }

  async function removeSection(sectionId) {
    if (!confirm("Delete this section and all its lessons?")) return;
    await api.del(`/course-sections/${sectionId}/`);
    load();
  }

  async function removeLesson(lessonId) {
    await api.del(`/course-lessons/${lessonId}/`);
    load();
  }

  async function submitForReview() {
    setError("");
    setSubmitting(true);
    try {
      await api.post(`/teacher-courses/${id}/submit/`, {});
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!course) return <p className="hm-page py-6 text-sm text-[var(--color-text-muted)]">Loading…</p>;

  return (
    <div className="hm-page flex flex-col gap-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">{course.title}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{course.short_description || "No description yet."}</p>
        </div>
        <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${STATUS_STYLES[course.status] || ""}`}>
          {course.status.replace("_", " ").toUpperCase()}
        </span>
      </div>

      {course.status === "rejected" && course.rejection_reason && (
        <p className="rounded-lg bg-brand-red-light px-3 py-2 text-sm text-brand-red">Rejection reason: {course.rejection_reason}</p>
      )}

      <div className="hm-card p-4">
        <p className="text-sm font-bold text-[var(--color-text)]">Curriculum</p>
        <div className="mt-3 flex flex-col gap-3">
          {(course.sections || []).map((section) => (
            <div key={section.id} className="rounded-xl border border-[var(--color-border)] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--color-text)]">{section.title}</p>
                <button onClick={() => removeSection(section.id)} className="text-xs font-semibold text-brand-red">
                  Remove section
                </button>
              </div>
              <ul className="mt-2 flex flex-col gap-1.5">
                {section.lessons.map((l) => (
                  <li key={l.id} className="flex items-center justify-between rounded-lg bg-[var(--color-surface-muted)] px-3 py-2 text-xs">
                    <span>
                      <span className="mr-2 rounded-md bg-white px-1.5 py-0.5 font-bold text-[var(--color-text-muted)]">{l.lesson_type}</span>
                      {l.title}
                      {l.video_title && <span className="text-[var(--color-text-muted)]"> — {l.video_title}</span>}
                      {l.test_title && <span className="text-[var(--color-text-muted)]"> — {l.test_title}</span>}
                    </span>
                    <button onClick={() => removeLesson(l.id)} className="font-semibold text-brand-red">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>

              {addingLessonTo === section.id ? (
                <AddLessonForm
                  sectionId={section.id}
                  onAdded={() => {
                    setAddingLessonTo(null);
                    load();
                  }}
                  onCancel={() => setAddingLessonTo(null)}
                />
              ) : (
                <button onClick={() => setAddingLessonTo(section.id)} className="mt-2 text-xs font-semibold text-brand-blue">
                  + Add lesson
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder="New section title"
            className="hm-input"
          />
          <button onClick={addSection} className="flex-none rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold">
            + Add section
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-brand-red">{error}</p>}

      <div className="flex items-center gap-3">
        {(course.status === "draft" || course.status === "rejected") && (
          <button
            onClick={submitForReview}
            disabled={submitting}
            className="rounded-xl bg-brand-blue px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
        )}
        <button onClick={() => router.push("/teacher/courses")} className="rounded-xl border border-[var(--color-border)] px-5 py-2 text-sm font-semibold">
          Back to My Courses
        </button>
      </div>
    </div>
  );
}

export default function EditCoursePage() {
  return (
    <RequireTeacher>
      <AppShell>
        <EditCourseContent />
      </AppShell>
    </RequireTeacher>
  );
}
