"use client";

export default function TestPageFooter() {
  return (
    <div className="mt-2 border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
      © {new Date().getFullYear()} Dr. Gutka. All rights reserved.
    </div>
  );
}
