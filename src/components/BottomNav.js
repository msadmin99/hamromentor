"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ChartIcon, GrandTestIcon, HomeIcon, QBankIcon, UserIcon } from "./icons";
import ProfileMenu from "./ProfileMenu";

const TABS = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/qbank", label: "Question Bank", Icon: QBankIcon },
  { href: "/exams", label: "Exams", Icon: GrandTestIcon, matchPrefixes: ["/exams", "/mock-test", "/daily-test", "/grand-test", "/past-year-questions"] },
  { href: "/performance", label: "Performance", Icon: ChartIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky bottom-0 z-20 flex border-t border-[var(--color-border)] bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
      {TABS.map(({ href, label, Icon, matchPrefixes }) => {
        const active = (matchPrefixes || [href]).some((p) => pathname === p || pathname.startsWith(`${p}/`));
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
          <span className={menuOpen ? "text-brand-blue" : "text-[var(--color-text-muted)]"}>Menu</span>
        </button>
      </div>
    </nav>
  );
}
