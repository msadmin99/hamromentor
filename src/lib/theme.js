// Deterministic accent palette cycled by position — Subject/Chapter/Topic have
// no color field in the DB (only icon/name/slug), so this stays purely
// presentational and is shared by every qbank drill-down level so the same
// subject always reads as the same accent as you go Subject -> Chapter -> Topic.
export const THEMES = [
  { iconBg: "bg-emerald-100", fg: "text-emerald-600", bar: "bg-emerald-500", corner: "bg-emerald-300" },
  { iconBg: "bg-violet-100", fg: "text-violet-600", bar: "bg-violet-500", corner: "bg-violet-300" },
  { iconBg: "bg-sky-100", fg: "text-sky-600", bar: "bg-sky-500", corner: "bg-sky-300" },
  { iconBg: "bg-amber-100", fg: "text-amber-600", bar: "bg-amber-500", corner: "bg-amber-300" },
  { iconBg: "bg-rose-100", fg: "text-rose-600", bar: "bg-rose-500", corner: "bg-rose-300" },
  { iconBg: "bg-cyan-100", fg: "text-cyan-600", bar: "bg-cyan-500", corner: "bg-cyan-300" },
];

export function themeForIndex(i) {
  return THEMES[i % THEMES.length];
}

/** Stable theme for a string (e.g. a subject slug) so a chapter/topic page
 * reached via a deep link — no sibling list/index in hand — still lands on
 * the same accent color the subject card used on the QBank home grid. */
export function themeForKey(key) {
  const str = String(key || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return themeForIndex(hash);
}
