"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import CourseSection from "@/components/plans/CourseSection";
import MembershipSection from "@/components/plans/MembershipSection";
import PlansFAQ from "@/components/plans/PlansFAQ";
import PlansHero from "@/components/plans/PlansHero";
import SingleTestSection from "@/components/plans/SingleTestSection";
import TestBundleSection from "@/components/plans/TestBundleSection";
import TrustBadges from "@/components/plans/TrustBadges";
import YourPurchasesCallout from "@/components/plans/YourPurchasesCallout";
import { api } from "@/lib/api";

const QBANK_FEATURES = ["Unlimited Practice", "Detailed Solutions", "All Subjects", "Performance Insights", "Bookmark & Revision Tools"];
const PYQ_FEATURES = ["IOM", "BPKIHS", "KU", "MOE", "Chapter-wise PYQs", "Detailed Solutions"];
const MOCK_FEATURES = ["Full Length Tests", "Exam-style Questions", "Detailed Analysis", "Performance Tracking"];
const DAILY_FEATURES = ["Daily New Tests", "Subject-wise & Mixed Tests", "Quick Analysis", "Track Daily Progress"];

function PlansContent() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [mySubscriptions, setMySubscriptions] = useState(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());

  useEffect(() => {
    api.get("/courses/").then((data) => {
      setCourses(data);
      if (data.length) setCourseId(String(data[0].id));
    });
    api.get("/my-subscriptions/").then(setMySubscriptions).catch(() => setMySubscriptions({ subscriptions: [], grand_test_access: [] }));
    api
      .get("/course-enrollments/mine/")
      .then((data) => setEnrolledCourseIds(new Set(data.map((e) => e.course))))
      .catch(() => {});
  }, []);

  return (
    <AppShell>
      <Header title="Membership & Store" showBack />

      <div className="hm-page flex flex-col gap-6 pb-16">
        <PlansHero />

        {courses.length > 1 && (
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="hm-input sm:max-w-xs">
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {courseId && (
          <>
            <MembershipSection
              productType="qbank"
              heading="Practice Question Bank"
              subtitle="Unlimited subject-wise MCQ practice with instant, detailed solutions."
              features={QBANK_FEATURES}
              courseId={courseId}
              subscriptions={mySubscriptions?.subscriptions}
            />

            <TestBundleSection
              productType="mock_test"
              heading="Mock Test"
              subtitle="Full-length exam simulations designed for real exam preparation."
              features={MOCK_FEATURES}
              courseId={courseId}
              subscriptions={mySubscriptions?.subscriptions}
            />

            <TestBundleSection
              productType="daily_test"
              heading="Daily Test"
              subtitle="Build consistency with daily exam-oriented practice."
              features={DAILY_FEATURES}
              courseId={courseId}
              subscriptions={mySubscriptions?.subscriptions}
            />

            <SingleTestSection courseId={courseId} grandTestAccess={mySubscriptions?.grand_test_access} />

            <MembershipSection
              productType="pyq"
              heading="Past Year Questions"
              subtitle="Practice authentic past questions from major medical examinations."
              features={PYQ_FEATURES}
              courseId={courseId}
              subscriptions={mySubscriptions?.subscriptions}
            />
          </>
        )}

        <CourseSection enrolledCourseIds={enrolledCourseIds} />

        <TrustBadges />

        <PlansFAQ />

        <YourPurchasesCallout />
      </div>

      <div className="sticky bottom-0 z-10 border-t border-[var(--color-border)] bg-white/95 px-4 py-2.5 backdrop-blur md:hidden">
        <a href="mailto:atech1627@gmail.com" className="block text-center text-xs font-bold text-brand-blue">
          Need help choosing? Contact Support →
        </a>
      </div>
    </AppShell>
  );
}

export default function PlansPage() {
  return (
    <RequireAuth>
      <PlansContent />
    </RequireAuth>
  );
}
