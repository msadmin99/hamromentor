"use client";

import { useEffect, useRef } from "react";

/**
 * Accessibility pass — the dialog behaviours every modal needs, in one
 * place.
 *
 * The audit found five overlay components in the student app, three of
 * which are byte-identical copies of `Drawer`'s shell. All five announced
 * themselves as overlays but behaved like plain divs: Escape did nothing,
 * Tab walked straight out into the page behind, focus never entered on
 * open, and never returned to the trigger on close. Patching five copies
 * would have left the sixth to be written wrong; this is the shared
 * correction.
 *
 * Two modes, because a modal dialog and a dropdown menu need different
 * things:
 *
 *   trap: true  (default) — a modal dialog. Focus moves in, Tab cycles
 *                inside, Escape closes, focus returns to the trigger.
 *   trap: false — a menu or popover. Escape closes and focus returns, but
 *                Tab is left alone: trapping focus in a navigation menu
 *                would strand a keyboard user who simply wanted to move on.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {{trap?: boolean}} [options]
 * @returns {import("react").RefObject<HTMLElement>} attach to the panel
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogA11y(open, onClose, { trap = true } = {}) {
  const panelRef = useRef(null);
  // Where focus was when this opened, so it can be handed back. Without
  // it, closing drops focus to the top of the document and a keyboard user
  // has to tab all the way back to where they were.
  const restoreRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    restoreRef.current = document.activeElement;

    if (trap) {
      // Focus the panel itself, not its first control: focusing a
      // destructive first button — "Submit Test" on the review sheet —
      // would be a trap of a different kind. Landing on the panel lets the
      // dialog's name be read first, then the user tabs in.
      panelRef.current?.focus();
    }

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (!trap || e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      // Queried fresh on each Tab: dialog content is dynamic (the Review
      // Answers list changes as questions are answered).
      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Restore only if focus was actually lost. If the caller
      // deliberately moved focus elsewhere on close — the navigator
      // jumping to a question — don't yank it back.
      const restore = restoreRef.current;
      const stranded = !document.activeElement || document.activeElement === document.body;
      if (stranded && restore && typeof restore.focus === "function") restore.focus();
    };
  }, [open, onClose, trap]);

  return panelRef;
}

export default useDialogA11y;
