// Card-level copy (ExamCard's badge + CTA gradient, and now TestPageHero's
// headline) — extracted from ExamCard.js so both consume the same strings
// instead of keeping two separate "Mock Test" copy blocks in sync by hand.
export const EXAM_TYPE_META = {
  qbank: { label: "Question Bank", emoji: "📖", subtitle: "Master Every Topic", tagline: "Practice makes perfect." },
  daily: { label: "Daily Test", emoji: "⏰", subtitle: "Stay Consistent", tagline: "One test a day, sharper every day." },
  mock: { label: "Mock Test", emoji: "📝", subtitle: "Practice & Improve", tagline: "Focused. Smart. Exam Ready." },
  grand: { label: "Grand Test", emoji: "🏆", subtitle: "Compete & Rank", tagline: "Compete. Rank. Excel." },
  pyq: { label: "Past Year Questions", emoji: "📚", subtitle: "Revise & Recall", tagline: "Learn from the past. Ace the future." },
};

// Shared copy/icon config for the test-listing page architecture (Illustration,
// PlatformStats, UserTestStats, WhyTakeTests) — one place to tweak per-exam-type
// text instead of duplicating it across Practice Question Bank / Mock Test /
// Daily Test / Grand Test / Past Year Questions.
export const EXAM_TYPE_PAGE_META = {
  qbank: {
    shortLabel: "Question Bank",
    icon: "📖",
    reasons: [
      "Practice unlimited questions by subject",
      "Instant explanations for every answer",
      "Track your weak areas over time",
      "Bookmark questions for later revision",
    ],
  },
  mock: {
    shortLabel: "Mock Test",
    icon: "📝",
    tagline: "Timed practice sets across every subject",
    reasons: [
      "Experience real exam environment",
      "Improve time management",
      "Identify strengths & weaknesses",
      "Track performance over time",
    ],
  },
  daily: {
    shortLabel: "Daily Test",
    icon: "⏰",
    tagline: "Released for a fixed 24-hour window — attempt before it expires",
    reasons: [
      "Build a consistent study habit",
      "Fresh questions released every day",
      "Stay sharp with quick, focused sets",
      "Compare your daily progress",
    ],
  },
  grand: {
    shortLabel: "Grand Test",
    icon: "🏆",
    tagline: "Live, exam-window tests — enrolled students get direct access, others can buy a seat",
    reasons: [
      "Full-length, exam-pattern tests",
      "Compete with peers on the leaderboard",
      "Get an accurate rank estimate",
      "Simulate real exam pressure",
    ],
  },
  pyq: {
    shortLabel: "Past Year Questions",
    icon: "📚",
    tagline: "Practice previous exam papers, grouped by university",
    reasons: [
      "Practice actual previous year papers",
      "Understand recurring exam patterns",
      "Benchmark against real cut-offs",
      "Revise high-yield repeated topics",
    ],
  },
};

export const TEST_GUIDELINES = [
  "All tests are time-bound",
  "Once started, a test cannot be paused",
  "Ensure a stable internet connection",
  "Do not refresh or close the test window",
];

export function computePlatformStats(tests) {
  return {
    available: tests.length,
    attempted: tests.filter((t) => (t.attempts_used ?? 0) > 0).length,
    upcoming: tests.filter((t) => t.card_status === "upcoming").length,
    reviewed: tests.filter((t) => t.card_status === "completed").length,
  };
}
