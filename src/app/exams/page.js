"use client";

import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import ExamCategoryCard from "@/components/exams/ExamCategoryCard";
import Header from "@/components/Header";
import {
  ArchiveIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartIcon,
  CheckCircleIcon,
  ClockIcon,
  DailyTestIcon,
  GrandTestIcon,
  MockTestIcon,
  RankIcon,
  ShuffleIcon,
  TopicIcon,
} from "@/components/icons";
import RequireAuth from "@/components/RequireAuth";
import { EXAM_TYPE_META } from "@/components/testpage/examTypeMeta";

// Mobile Exams Hub Visual Redesign — reproduces the supplied "updated"
// reference screenshot's card architecture (large horizontal premium
// cards) in place of the previous plain stacked-row list.
//
// This remains, as it always was, a static category catalog — no test
// object exists at this level, so none of the server's per-test access
// decision fields exist for "a category" either (only for an actual Test
// row on the destination pages), and none is fetched or invented here.
// See ExamCategoryCard.js's own comment and Step 22 of the task spec
// ("visibility ≠ access" — this hub communicates what exists, the
// destination page controls what a student may consume). All four
// categories are always shown, to every student, regardless of payment
// status — exactly as before.
//
// `badge` and `panelLabel` reuse EXAM_TYPE_META[type].subtitle (already
// the exact per-category subtitle shown as the page heading on
// TestPageHero for these very categories) rather than inventing new
// marketing copy. `description` is the same wording this page already
// used before this redesign.
//
// Feature chips list only capabilities that are genuinely real today —
// notably NOT the reference's "Random Questions" (Mock Test's questions
// are a fixed, admin-curated set; only their *order* is shuffled per
// attempt, via Test.shuffle_questions/shuffle_options, default True — so
// this uses "Shuffled Order" instead) and NOT a literal "leaderboard" list
// (no such view exists anywhere in the app; "Rank & Percentile" is what
// the actual result page shows, computed in tests_app/lifecycle.py). The
// reference's numeric "200 Questions / 3 Hours"-style metadata row is
// deliberately not reproduced: question count and duration are configured
// per individual Test, not fixed per category, so a single hard-coded
// number for the whole category would be fabricated data.
const EXAM_CATEGORIES = [
  {
    href: "/mock-test",
    title: "Mock Test",
    Icon: MockTestIcon,
    description: "Practice anytime, review anytime.",
    badge: EXAM_TYPE_META.mock.subtitle,
    panelLabel: "Practice Anytime",
    features: [
      { label: "Shuffled Order", ChipIcon: ShuffleIcon },
      { label: "Instant Results", ChipIcon: CheckCircleIcon },
      { label: "Detailed Review", ChipIcon: ChartIcon },
    ],
  },
  {
    href: "/daily-test",
    title: "Daily Test",
    Icon: DailyTestIcon,
    description: "A new set of questions every day. Available for 24 hours.",
    badge: EXAM_TYPE_META.daily.subtitle,
    panelLabel: "Stay Consistent",
    features: [
      { label: "New Set Daily", ChipIcon: CalendarIcon },
      { label: "24-Hour Window", ChipIcon: ClockIcon },
      { label: "Instant Results", ChipIcon: CheckCircleIcon },
    ],
  },
  {
    href: "/grand-test",
    title: "Grand Test",
    Icon: GrandTestIcon,
    description: "Live exam-window test, scored with a rank and percentile.",
    badge: EXAM_TYPE_META.grand.subtitle,
    panelLabel: "Challenge Yourself",
    features: [
      { label: "Live Exam Window", ChipIcon: ClockIcon },
      { label: "Rank & Percentile", ChipIcon: RankIcon },
      { label: "Detailed Review", ChipIcon: ChartIcon },
    ],
  },
  {
    href: "/past-year-questions",
    title: "Past Year Questions",
    Icon: ArchiveIcon,
    description: "Practice real questions from previous years' exams.",
    badge: EXAM_TYPE_META.pyq.subtitle,
    panelLabel: "Learn From The Past",
    features: [
      { label: "By University", ChipIcon: BookOpenIcon },
      { label: "Exam-Style Practice", ChipIcon: TopicIcon },
      { label: "Instant Results", ChipIcon: CheckCircleIcon },
    ],
  },
];

function ExamsContent() {
  return (
    <AppShell>
      <Header title="Exams" subtitle="Choose an exam type and start your preparation" courseSwitcher={<CourseSwitcher variant="solid" />}>
        {/* Reference's "Your Success / Our Mission" + graduation-cap + "Learn
            Practice Succeed" mission copy — purely decorative brand
            identity, no data behind it. Shown from `sm` up: at real phone
            widths (<640px, the primary target — see Steps 4/29) there
            isn't room for it without either shrinking the functional title/
            subtitle/course-selector or exceeding the ~190-230px hero-height
            target, so it's a progressive enhancement rather than forced
            onto the narrowest screens. */}
        <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-3 sm:flex md:right-10 md:gap-5">
          <div className="text-right leading-tight">
            <p className="text-xs font-semibold text-white/70">Your Success</p>
            <p className="text-xs font-semibold text-white/70">Our Mission</p>
          </div>
          <span className="text-3xl opacity-80 md:text-4xl" aria-hidden="true">
            🎓
          </span>
          <p className="hidden text-xs italic leading-snug text-white/50 md:block">
            Learn
            <br />
            Practice
            <br />
            Succeed
          </p>
        </div>
      </Header>

      <div className="hm-page flex flex-col gap-4 sm:gap-5">
        {EXAM_CATEGORIES.map((c) => (
          <ExamCategoryCard key={c.href} {...c} />
        ))}
      </div>
    </AppShell>
  );
}

export default function ExamsPage() {
  return (
    <RequireAuth>
      <ExamsContent />
    </RequireAuth>
  );
}
