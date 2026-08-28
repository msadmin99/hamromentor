"use client";

import Link from "next/link";
import { BookmarkIcon, UserIcon } from "@/components/icons";

/** Same header icon row across Daily/Mock/Grand/PYQ — real destinations
 * only (Bookmarks, Profile). No notification bell: no notifications
 * feature exists anywhere on this platform, so a bell/badge here would be
 * decorative, not real. */
export default function TestPageHeaderIcons() {
  return (
    <>
      <Link href="/qbank/bookmarks" aria-label="Bookmarks">
        <BookmarkIcon />
      </Link>
      <Link href="/profile" aria-label="Profile">
        <UserIcon />
      </Link>
    </>
  );
}
