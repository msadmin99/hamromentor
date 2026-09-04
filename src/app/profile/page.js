"use client";

import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import ActivityStats from "@/components/profile/ActivityStats";
import CourseCard from "@/components/profile/CourseCard";
import PersonalInfoCard from "@/components/profile/PersonalInfoCard";
import { ProfileNavRow, ProfileNavSection } from "@/components/profile/ProfileNav";
import ProfileHero from "@/components/profile/ProfileHero";
import SubscriptionCard from "@/components/profile/SubscriptionCard";
import {
  BookmarkIcon,
  ChartIcon,
  HelpCircleIcon,
  LogoutIcon,
  MailIcon,
  QBankIcon,
  SettingsIcon,
  TestsIcon,
  TopicIcon,
  VideosIcon,
  WarningTriangleIcon,
} from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { useCourse } from "@/lib/course-context";

const SUPPORT_EMAIL = "atech1627@gmail.com";

/**
 * Student Account & Learning Center (Mobile Exams-style redesign, Phase B
 * of the frontend audit's implementation plan). Replaces the old single flat
 * avatar-card + Row-list + Logout page.
 *
 * Every section reads from an endpoint or route that already exists
 * elsewhere in the app — see each component's own file comment for exactly
 * which one. This page adds no new API endpoint and no new route; it's a
 * information-architecture and visual pass over data the app already had.
 */
function ProfileContent() {
  const { user, logout } = useAuth();
  const { activeCourse } = useCourse();
  const router = useRouter();

  function handleLogout() {
    // Byte-for-byte the same logout call the old page made.
    logout();
    router.push("/login");
  }

  return (
    <AppShell>
      <Header title="Profile" showBack />

      <div className="hm-page flex flex-col gap-5 pb-6">
        <ProfileHero user={user} courseName={activeCourse?.name} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <CourseCard activeCourse={activeCourse} />
          <SubscriptionCard />
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Learning &amp; Exam Activity</p>
          <ActivityStats />
        </div>

        {/* Two columns balanced by row-count (6+2 vs. 8+1), not just by
            topic, so neither side trails off into a large empty gap on
            desktop — Study Resources (6 rows) pairs with Help & Support (2
            rows) on the left; Personal Information (8 rows, the longest
            single block) pairs with the one-row Account & Settings on the
            right. */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <ProfileNavSection title="Study Resources">
              <ProfileNavRow href="/qbank" Icon={QBankIcon} label="QBank" description="Practice questions by subject, chapter and topic" />
              <ProfileNavRow href="/qbank/bookmarks" Icon={BookmarkIcon} label="Bookmarks" description="Questions you saved for later" />
              <ProfileNavRow href="/qbank/mistakes" Icon={WarningTriangleIcon} label="Mistakes" description="Review questions you previously got wrong" />
              <ProfileNavRow href="/tests/history" Icon={TestsIcon} label="Test History" description="Every exam you've submitted" />
              <ProfileNavRow href="/videos" Icon={VideosIcon} label="Videos" description="Video lectures for your course" />
              <ProfileNavRow href="/performance" Icon={ChartIcon} label="My Performance" description="Your personal analytics center" />
            </ProfileNavSection>

            <ProfileNavSection title="Help & Support">
              <ProfileNavRow href="/faq" Icon={HelpCircleIcon} label="FAQ" description="Answers to common questions" />
              <ProfileNavRow href={`mailto:${SUPPORT_EMAIL}`} Icon={MailIcon} label="Contact Support" description={SUPPORT_EMAIL} />
            </ProfileNavSection>
          </div>

          <div className="flex flex-col gap-5">
            <PersonalInfoCard user={user} />

            <ProfileNavSection title="Account & Settings">
              <ProfileNavRow href="/settings" Icon={SettingsIcon} label="Settings" description="Name, password, payment preference and course" />
            </ProfileNavSection>
          </div>
        </div>

        <ProfileNavSection title="About">
          <ProfileNavRow href="/terms" Icon={TopicIcon} label="Terms & Conditions" />
          <ProfileNavRow href="/refund-policy" Icon={TopicIcon} label="Refund Policy" />
        </ProfileNavSection>

        <ProfileNavSection>
          <ProfileNavRow onClick={handleLogout} Icon={LogoutIcon} label="Log out" tone="danger" />
        </ProfileNavSection>
      </div>
    </AppShell>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
