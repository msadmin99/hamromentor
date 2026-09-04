export function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M3 11.5L12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function QBankIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10.5" cy="10.5" r="6.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <circle cx="10.5" cy="10.5" r="6.5" strokeLinecap="round" />
      <path d="M20 20l-4.8-4.8" strokeLinecap="round" />
    </svg>
  );
}

export function TestsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="3.5" width="14" height="17" rx="1.6" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
      <path d="M8.2 8.5h7.6M8.2 12h7.6M8.2 15.5h4.5" strokeLinecap="round" />
    </svg>
  );
}

export function VideosIcon({ active, ...props }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="6" width="14" height="12" rx="1.8" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
      <path d="M17 10l4-2.4v8.8L17 14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Exams hub redesign: these four now also spread `...props` (className,
// aria-hidden) so they can be resized/hidden when reused as a large card
// visual, on top of the existing `active` prop. Existing Sidebar/
// ExploreTestTypes/SuggestedTestsRow/BottomNav callers pass neither extra
// prop, so their rendering is unchanged.
export function MockTestIcon({ active, ...props }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="6" y="3.5" width="12" height="17" rx="1.6" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
      <path d="M9 2.5h6v2.2H9z" fill="currentColor" fillOpacity={active ? 0.9 : 0.4} stroke="none" />
      <path d="M9 9.5l1.6 1.6L14 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 15h6" strokeLinecap="round" />
    </svg>
  );
}

export function DailyTestIcon({ active, ...props }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="13" r="7.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
      <path d="M12 9.3V13l2.6 1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 2.8h6M12 2.8v2" strokeLinecap="round" />
    </svg>
  );
}

export function GrandTestIcon({ active, ...props }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 4h10v4.2a5 5 0 01-10 0V4z" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} strokeLinejoin="round" />
      <path d="M7 5H4.5a1 1 0 00-1 1.2c.4 2 1.6 3.3 3.6 3.6M17 5h2.5a1 1 0 011 1.2c-.4 2-1.6 3.3-3.6 3.6" strokeLinecap="round" />
      <path d="M12 13.2V17M9 20.5h6M9.5 20.5c0-2 .8-3.1 2.5-3.5 1.7.4 2.5 1.5 2.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArchiveIcon({ active, ...props }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="4" width="17" height="4" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <path d="M5 8v10.5a1.5 1.5 0 001.5 1.5h11a1.5 1.5 0 001.5-1.5V8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12.5h4" strokeLinecap="round" />
    </svg>
  );
}

export function ChartIcon({ active, ...props }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.08 : 0} />
      <path d="M7.5 15.5v-3M12 15.5v-6M16.5 15.5v-9" strokeLinecap="round" />
    </svg>
  );
}

export function WalletIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="6" width="17" height="13" rx="2" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.1 : 0} />
      <path d="M3.5 10h17" />
      <circle cx="16" cy="14" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SettingsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="2.8" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDownIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...props}>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...props}>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TopicIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 9.5h8M8 13h5" strokeLinecap="round" />
    </svg>
  );
}

export function TrophyIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 4h10v4.2a5 5 0 01-10 0V4z" strokeLinejoin="round" />
      <path d="M7 5H4.5a1 1 0 00-1 1.2c.4 2 1.6 3.3 3.6 3.6M17 5h2.5a1 1 0 011 1.2c-.4 2-1.6 3.3-3.6 3.6" strokeLinecap="round" />
      <path d="M12 13.2V17M9 20.5h6M9.5 20.5c0-2 .8-3.1 2.5-3.5 1.7.4 2.5 1.5 2.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8" strokeLinecap="round" />
    </svg>
  );
}

export function BookmarkIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6 4.5h12a.5.5 0 0 1 .5.5v15l-6.5-4-6.5 4V5a.5.5 0 0 1 .5-.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function UserIcon({ active, ...props }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <circle cx="12" cy="8" r="3.5" fillOpacity={active ? 0.15 : 0} />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </svg>
  );
}

export function FlagIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M5 4v16" strokeLinecap="round" />
      <path d="M5 4.5h11.5l-2.5 4 2.5 4H5" strokeLinejoin="round" />
    </svg>
  );
}

export function WarningTriangleIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 4.5l9 15.5H3l9-15.5z" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M12 10v4.5" strokeLinecap="round" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

// --- Added for the Exams hub premium redesign (Mobile Exams Hub Visual
// Redesign) — small, single-purpose pictograms in the same 24-viewport /
// stroke-1.8 language as every icon above, not a new icon library. ---

/** Open book — the Exams hero's course-selector (solid variant) and the
 * Past Year Questions card's "By University" chip. */
export function BookOpenIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 6.5c-1.6-1.3-3.6-1.8-6-1.8v13c2.4 0 4.4.5 6 1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6.5c1.6-1.3 3.6-1.8 6-1.8v13c-2.4 0-4.4.5-6 1.8V6.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Two crossed arrows — "shuffled" question/option order (Mock Test chip). */
export function ShuffleIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 6h4l10 12h4M17 6h4v4M21 6l-5.5 6.5M3 18h4l3-3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 18h4v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Checkmark in a circle — "Instant Results" chip. */
export function CheckCircleIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.3 12.3l2.4 2.4 5-5.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Page-a-day calendar — "New Set Daily" chip (Daily Test). */
export function CalendarIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="1.8" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" strokeLinecap="round" />
    </svg>
  );
}

/** Plain clock face — "24-Hour Window" / "Live Exam Window" chips, distinct
 * from DailyTestIcon's branded circle so a card never shows the same glyph
 * twice. */
export function ClockIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Bar-and-podium glyph — "Rank & Percentile" chip (Grand Test). */
export function RankIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 20v-6M12 20V6M20 20v-10" strokeLinecap="round" />
    </svg>
  );
}

// --- Added for the Profile redesign (Phase B) — same hand-authored,
// 24-viewport / stroke-1.8 language as every icon above. ---

/** Question mark in a circle — Help & Support / FAQ. */
export function HelpCircleIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.3a2.5 2.5 0 0 1 4.7 1.2c0 1.7-2.2 1.8-2.2 3.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Envelope — Contact Support. */
export function MailIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="1.8" />
      <path d="M4.5 6.5l7.5 6 7.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Door + arrow — Log out. Extracted from MoreMenu.js's inline SVG (same
 * path data, byte-identical render) so Profile and MoreMenu share one
 * definition instead of two copies of the same icon. */
export function LogoutIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Small pencil — Edit Profile CTA. */
export function EditIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 20h4L18.5 9.5a2 2 0 0 0-4-4L4 16v4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 6.5l4 4" strokeLinecap="round" />
    </svg>
  );
}

/** Padlock — locked/premium content. Added in the design-system pass
 * (Phase C) to replace the 🔒 emoji that was standing in for this exact
 * meaning in ~8 places (PRO badges, locked video/course states, the
 * Grand Test unlock CTA) with no shared icon before now. */
export function LockIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" strokeLinecap="round" />
    </svg>
  );
}

// Phase D, Area 3: a play-button overlay for video thumbnails — the one
// icon the brief names that didn't already exist. Filled (not stroked),
// matching how a play glyph reads at small sizes.
export function PlayIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

// Phase D, Area 4: the invoice page's print action — no existing icon
// covers it.
export function PrintIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 9V3h12v6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4.5" y="9" width="15" height="8" rx="1.5" />
      <path d="M6 15h12v6H6z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
