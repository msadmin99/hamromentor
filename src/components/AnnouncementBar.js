"use client";

import { useState } from "react";

export default function AnnouncementBar({ announcement }) {
  const [dismissed, setDismissed] = useState(false);
  if (!announcement || dismissed) return null;

  return (
    <div className="flex items-center gap-3 bg-[#0c2b3a] px-4 py-3 text-white">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 border-brand-green text-[10px] font-bold text-brand-green">
        %
      </span>
      <p className="flex-1 text-xs leading-snug">
        {announcement.message}{" "}
        {announcement.coupon_code && (
          <>
            Use coupon <span className="font-bold text-brand-green">{announcement.coupon_code}</span> to get extra
            10% off.
          </>
        )}
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="flex-none text-white/70 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
