"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { BookmarkIcon, ChartIcon, QBankIcon, TestsIcon, UserIcon } from "./icons";
import ProfileMenu from "./ProfileMenu";

// Practice / Tests / Progress / Bookmarks / More — matches the QBank
// redesign's mobile nav spec. This replaces the standalone "Home" tab (the
// /home dashboard page itself is untouched and still reachable elsewhere,
// just no longer a primary bottom-tab) with Practice pointing straight at
// the Question Bank homepage, and adds a direct Bookmarks tab.
const TABS = [
  // excludePrefixes: Practice's own /qbank/* range would otherwise also
  // match /qbank/bookmarks, double-highlighting it alongside the dedicated
  // Bookmarks tab below.
  { href: "/qbank", label: "Practice", Icon: QBankIcon, excludePrefixes: ["/qbank/bookmarks"] },
  { href: "/exams", label: "Tests", Icon: TestsIcon, matchPrefixes: ["/exams", "/mock-test", "/daily-test", "/grand-test", "/past-year-questions"] },
  { href: "/performance", label: "Progress", Icon: ChartIcon },
  { href: "/qbank/bookmarks", label: "Bookmarks", Icon: BookmarkIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky bottom-0 z-20 flex border-t border-[var(--color-border)] bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
      {TABS.map(({ href, label, Icon, matchPrefixes, excludePrefixes }) => {
        const matches = (matchPrefixes || [href]).some((p) => pathname === p || pathname.startsWith(`${p}/`));
        const excluded = (excludePrefixes || []).some((p) => pathname === p || pathname.startsWith(`${p}/`));
        const active = matches && !excluded;
        return (
          <button
            key={href}
            onClick={() => router.push(href)}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
          >
            <span className={active ? "text-brand-blue" : "text-[var(--color-text-muted)]"}>
              <Icon active={active} />
            </span>
            <span className={active ? "text-brand-blue" : "text-[var(--color-text-muted)]"}>{label}</span>
          </button>
        );
      })}

      <div className="relative flex flex-1 flex-col items-center">
        {menuOpen && <ProfileMenu user={user} onClose={() => setMenuOpen(false)} align="right" />}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
        >
          <span className={menuOpen ? "text-brand-blue" : "text-[var(--color-text-muted)]"}>
            <UserIcon active={menuOpen} />
          </span>
          <span className={menuOpen ? "text-brand-blue" : "text-[var(--color-text-muted)]"}>More</span>
        </button>
      </div>
    </nav>
  );
}
