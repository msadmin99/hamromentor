"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CheckoutModal from "@/components/CheckoutModal";
import CourseSwitcher from "@/components/CourseSwitcher";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { CheckCircleIcon } from "@/components/icons";
import AvailablePlans from "@/components/subscription/AvailablePlans";
import BillingInfo from "@/components/subscription/BillingInfo";
import CouponWidget from "@/components/subscription/CouponWidget";
import PaymentHistoryTable from "@/components/subscription/PaymentHistoryTable";
import PlanFeatures from "@/components/subscription/PlanFeatures";
import PurchasedCourses from "@/components/subscription/PurchasedCourses";
import RecentActivity from "@/components/subscription/RecentActivity";
import RecommendedPlans from "@/components/subscription/RecommendedPlans";
import SummaryCard from "@/components/subscription/SummaryCard";
import Timeline from "@/components/subscription/Timeline";
import { ErrorCard } from "@/components/subscription/billingShared";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

// Phase D, Area 4: same /my-subscriptions/ and /purchases/ endpoints as
// before, fetched together — every section on this page (SummaryCard,
// PlanFeatures, BillingInfo, Timeline, PaymentHistoryTable, RecentActivity,
// RecommendedPlans) depends on one or both, so a single load()/error state
// covers all of them rather than each silently rendering its own "empty"
// copy on a fetch failure it can't tell apart from a genuinely-empty account.

function SkeletonBlock({ className }) {
  return <div className={`animate-pulse rounded-2xl bg-[var(--color-surface-muted)] ${className}`} />;
}

function SubscriptionsContent() {
  const { activeCourse, enrollments } = useCourse();
  const [data, setData] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [error, setError] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [upgradeProduct, setUpgradeProduct] = useState(null);

  const load = useCallback(() => {
    Promise.all([api.get("/my-subscriptions/"), api.get("/purchases/")])
      .then(([subs, purch]) => {
        setData(subs);
        setPurchases(purch);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  async function toggleAutoRenew(sub) {
    setTogglingId(sub.id);
    try {
      await api.patch(`/subscriptions/${sub.id}/auto-renew/`, { auto_renew: !sub.auto_renew });
      load();
    } finally {
      setTogglingId(null);
    }
  }

  function scrollToPlans(productType) {
    setUpgradeProduct(productType);
    document.getElementById("available-plans")?.scrollIntoView({ behavior: "smooth" });
  }

  function scrollToSubscriptions() {
    document.getElementById("your-subscriptions")?.scrollIntoView({ behavior: "smooth" });
  }

  if (error) {
    return (
      <AppShell>
        <Header title="My Subscription" showBack />
        <div className="hm-page-narrow">
          <ErrorCard title="Unable to load your subscription." onRetry={load} />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <Header title="My Subscription" showBack />
        <div className="hm-page flex flex-col gap-5">
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-40" />
          <SkeletonBlock className="h-40" />
        </div>
      </AppShell>
    );
  }

  // Top-level status: a student can hold several products (qbank/video/
  // mock_test/...) with different statuses at once, so "active" means "at
  // least one is currently usable" — the real, honest answer to "do I have
  // paid access to anything right now", not a fabricated single plan name.
  const hasActive = data.subscriptions.some((s) => s.is_current);
  const hasAny = data.subscriptions.length > 0;

  return (
    <AppShell>
      <Header title="My Subscription" subtitle="Manage your plan, billing and invoices" courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page flex flex-col gap-5">
        {/* Top-level status hierarchy: active / expired / free plan */}
        <section className="hm-card flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            {hasActive && (
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-green-light text-brand-green">
                <CheckCircleIcon className="h-6 w-6" />
              </span>
            )}
            <div>
              <p className="text-base font-bold text-[var(--color-text)]">
                {hasActive
                  ? "Your subscription is active."
                  : hasAny
                    ? "Your subscription has expired."
                    : "You're currently on the free plan."}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {hasActive
                  ? `${data.subscriptions.filter((s) => s.is_current).length} active plan${
                      data.subscriptions.filter((s) => s.is_current).length === 1 ? "" : "s"
                    }`
                  : hasAny
                    ? "Renew to keep your access without interruption."
                    : "Choose a plan that fits your preparation."}
              </p>
            </div>
          </div>
          {hasActive ? (
            <button type="button" onClick={scrollToSubscriptions} className="hm-btn-primary text-sm">
              Manage Subscription
            </button>
          ) : (
            <button type="button" onClick={() => scrollToPlans(null)} className="hm-btn-primary text-sm">
              {hasAny ? "Renew" : "View Plans"}
            </button>
          )}
        </section>

        {/* 1 & 2. Subscription dashboard + current plan details */}
        <section id="your-subscriptions" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Your subscriptions</p>
            <Link href="#available-plans" className="text-xs font-bold text-brand-blue">
              + Browse plans
            </Link>
          </div>
          {data.subscriptions.map((s) => (
            <SummaryCard key={s.id} subscription={s} onToggleAutoRenew={toggleAutoRenew} togglingId={togglingId} onUpgrade={scrollToPlans} />
          ))}
          {data.subscriptions.length === 0 && (
            <p className="hm-card p-4 text-sm text-[var(--color-text-muted)]">
              No subscriptions yet — browse plans below to get started.
            </p>
          )}
        </section>

        <PlanFeatures subscriptions={data.subscriptions} courseNames={[...new Set(data.subscriptions.map((s) => s.course_name))]} />

        {/* 3. Available plans */}
        <div id="available-plans">
          <AvailablePlans
            key={upgradeProduct}
            courseId={activeCourse?.id}
            initialProduct={upgradeProduct}
            onBuy={(plan) => setCheckoutPlan(plan)}
          />
        </div>

        {/* 5. Subscription timeline */}
        <Timeline subscriptions={data.subscriptions} purchases={purchases} />

        {/* 6. Billing information */}
        <BillingInfo purchases={purchases} />

        {/* 7 & 8. Payment history + invoice center */}
        <PaymentHistoryTable purchases={purchases} />

        {/* 9. Coupons */}
        <CouponWidget />

        {/* Grand tests (existing content, kept) */}
        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Grand Tests</p>
          <div className="flex flex-col gap-2">
            {data.grand_test_access.map((a) => (
              <div key={a.id} className="hm-card p-4">
                <p className="font-semibold text-[var(--color-text)]">{a.test_title}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {a.granted_at ? `Password: ${a.password}` : "Awaiting payment approval"}
                  {a.email_sent_at && " · Emailed to you"}
                </p>
              </div>
            ))}
            {data.grand_test_access.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">No Grand Test purchases yet.</p>
            )}
          </div>
        </section>

        {/* 14. Purchased courses */}
        <PurchasedCourses enrollments={enrollments} />

        {/* 19. Recommended plans */}
        <RecommendedPlans subscriptions={data.subscriptions} courseName={activeCourse?.name} onExplore={scrollToPlans} />

        {/* Recent activity (honest "audit log") */}
        <RecentActivity purchases={purchases} />

        {/* 18. Help & support */}
        <section className="hm-card p-4">
          <p className="text-sm font-bold text-[var(--color-text)]">Help & Support</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Link href="/faq" className="rounded-lg border border-[var(--color-border)] p-3 text-center text-xs font-semibold text-[var(--color-text)]">
              FAQs
            </Link>
            <a
              href="mailto:atech1627@gmail.com"
              className="rounded-lg border border-[var(--color-border)] p-3 text-center text-xs font-semibold text-[var(--color-text)]"
            >
              Contact Support
            </a>
            <Link
              href="/refund-policy"
              className="rounded-lg border border-[var(--color-border)] p-3 text-center text-xs font-semibold text-[var(--color-text)]"
            >
              Refund Policy
            </Link>
            <Link href="/terms" className="rounded-lg border border-[var(--color-border)] p-3 text-center text-xs font-semibold text-[var(--color-text)]">
              Terms & Conditions
            </Link>
          </div>
        </section>
      </div>

      {checkoutPlan && (
        <CheckoutModal
          kind="subscription"
          plan={checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          onSubmitted={load}
        />
      )}
    </AppShell>
  );
}

export default function SubscriptionsPage() {
  return (
    <RequireAuth>
      <SubscriptionsContent />
    </RequireAuth>
  );
}
