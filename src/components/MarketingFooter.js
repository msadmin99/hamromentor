import { buildMailtoUrl, buildWhatsappUrl, SUPPORT_CONTACT } from "@/lib/support";
import Logo from "./Logo";

const FALLBACK_LINKS = [
  { label: "Contact Us", url: buildMailtoUrl() },
];

export default function MarketingFooter({ links, copyright = "© 2026 Dr. Gutka. All rights reserved." }) {
  const footerLinks = links && links.length > 0 ? links : FALLBACK_LINKS;

  return (
    <footer className="hm-marketing-bar">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Logo size={28} dark />
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((l) => (
              <a key={l.label} href={l.url} className="text-sm font-medium text-white/80 hover:text-white">
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 border-t border-white/10 pt-6 text-xs text-white/60">
          <span className="font-bold text-white/80">Help &amp; Support</span>
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chat with Dr. Gutka Support on WhatsApp: ${SUPPORT_CONTACT.whatsappDisplay}`}
            className="hover:text-white"
          >
            WhatsApp: {SUPPORT_CONTACT.whatsappDisplay} <span className="text-white/40">({SUPPORT_CONTACT.whatsappNote})</span>
          </a>
          <a
            href={buildMailtoUrl()}
            aria-label={`Email Dr. Gutka Support: ${SUPPORT_CONTACT.email}`}
            className="hover:text-white"
          >
            Email: {SUPPORT_CONTACT.email}
          </a>
        </div>

        <p className="mt-6 text-xs text-white/40">{copyright}</p>
      </div>
    </footer>
  );
}
