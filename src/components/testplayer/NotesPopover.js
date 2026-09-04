"use client";

import { useEffect, useState } from "react";

import { useDialogA11y } from "@/lib/useDialogA11y";

function storageKey(attemptId, questionId) {
  return `test-notes:${attemptId}:${questionId}`;
}

/** Per-question scratch note — deliberately local-only (browser localStorage),
 * not synced to any backend/account. No Notes model exists (or was asked
 * for) on this platform; presenting this as account-wide/cross-device would
 * be fabricating a capability that isn't real. Labelled honestly in the UI. */
export default function NotesPopover({ attemptId, questionId, open, onClose }) {
  // Accessibility pass: Escape, focus trap and focus return, shared with
  // Drawer so this copy of the same shell cannot drift away from it.
  const panelRef = useDialogA11y(open, onClose);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) return;
    setValue(localStorage.getItem(storageKey(attemptId, questionId)) || "");
  }, [open, attemptId, questionId]);

  function save() {
    const key = storageKey(attemptId, questionId);
    if (value.trim()) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="presentation">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Question notes"
        className="w-full max-w-sm rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:rounded-2xl"
      >
        <p className="text-sm font-bold text-[var(--color-text)]">Notes</p>
        <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">Saved on this device only — not synced to your account.</p>
        {/* autoFocus removed in the accessibility pass: useDialogA11y moves
            focus to the dialog panel on open, and a competing autoFocus made
            which element ended up focused depend on effect ordering. Focus
            now lands on the dialog (so its name is announced first) and Tab
            reaches this field. */}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={5}
          placeholder="Jot down a quick note for this question…"
          className="hm-input mt-3 w-full resize-none"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)]">
            Cancel
          </button>
          <button type="button" onClick={save} className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white">
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

export function hasNote(attemptId, questionId) {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(storageKey(attemptId, questionId));
}
