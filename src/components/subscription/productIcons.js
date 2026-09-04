"use client";

import { ArchiveIcon, BookOpenIcon, DailyTestIcon, MockTestIcon, VideosIcon } from "@/components/icons";

// Phase D, Area 4: product_type -> {label, Icon}, the one canonical map for
// what used to be five separate hardcoded {label, icon: "emoji"} arrays
// (SummaryCard, AvailablePlans, PlanFeatures, BuildYourOwnCombo, plus
// ComboPlansSection's own short-label variant) — each drawing its emoji
// slightly differently (qbank was 📚 in three places, 📘 in a fourth).
// Reuses the exact icons Sidebar/MoreMenu/BottomNav already use for these
// same five products, so a subscription card and the nav item it grants
// access to now show the same glyph.
export const PRODUCT_META = {
  qbank: { label: "Question Bank", Icon: BookOpenIcon },
  daily_test: { label: "Daily Test", Icon: DailyTestIcon },
  mock_test: { label: "Mock Test", Icon: MockTestIcon },
  video: { label: "Video Lectures", Icon: VideosIcon },
  pyq: { label: "Past Year Questions", Icon: ArchiveIcon },
};

export function productMeta(productType) {
  return PRODUCT_META[productType] || { label: productType, Icon: null };
}
