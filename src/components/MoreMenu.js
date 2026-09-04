"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Drawer from "./Drawer";
import { ArchiveIcon, BookmarkIcon, UserIcon, VideosIcon, WalletIcon } from "./icons";

// Mobile bottom-nav redesign: the secondary destinations that don't fit
// in the 5-item primary bar. Built on the existing Drawer primitive (same
// Escape/focus-trap/focus-return every other sheet in the app already
// gets via useDialogA11y) rather than a new modal framework — see
// Drawer.js.
//
// Deliberately NOT ProfileMenu: that component is shared with the desktop
// Sidebar's own profile dropdown (support links, promo codes, teacher
// application, etc.) — extending it here would have changed desktop too.
// This is a separate, mobile-only component so the desktop sidebar is
// untouched by this task, exactly as scoped.
const ITEMS = [
  { href: "/qbank/bookmarks", label: "Bookmarks", Icon: BookmarkIcon },
  { href: "/videos", label: "Videos", Icon: VideosIcon },
  { href: "/courses", label: "Video Lecture Courses", Icon: ArchiveIcon },
  { href: "/subscriptions", label: "My Subscriptions", Icon: WalletIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
];

export default function MoreMenu({ onClose }) {
  const router = useRouter();
  const { logout } = useAuth();

  function handleLogout() {
    // Same underlying action Sidebar's own "Log out" button and the
    // Profile page use (useAuth().logout() + redirect to /login) — not a
    // second implementation of sign-out.
    logout();
    onClose();
    router.push("/login");
  }

  return (
    <Drawer open onClose={onClose} title="More">
      <nav aria-label="More" className="-m-5 flex flex-col divide-y divide-[var(--color-border)]">
        {ITEMS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-[var(--color-text)]"
          >
            <Icon />
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-3.5 text-left text-sm font-semibold text-brand-red"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Log out
        </button>
      </nav>
    </Drawer>
  );
}
