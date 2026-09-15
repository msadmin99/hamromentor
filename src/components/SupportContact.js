import { buildGmailUrl, buildMailtoUrl, buildWhatsappUrl, SUPPORT_CONTACT } from "@/lib/support";
import { MailIcon, WhatsappIcon } from "./icons";

/**
 * Compact, reusable "contact us" row — used everywhere support access is
 * needed inline with existing page content (login, checkout, subscriptions,
 * results, the exams hub, error boundaries). For the full, dedicated
 * treatment see SupportContactCard (used only on /support).
 *
 * `whatsappMessage`, if given, must stay short and generic (see
 * lib/support.js's own docstring) — never pass anything containing a
 * password, OTP, token, payment detail, or internal ID.
 */
export function SupportContactInline({ heading, whatsappMessage, className = "" }) {
  return (
    <div className={className}>
      {heading ? <p className="mb-2 text-sm font-bold text-[var(--color-text)]">{heading}</p> : null}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        <a
          href={buildWhatsappUrl(whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat with Dr. Gutka Support on WhatsApp: ${SUPPORT_CONTACT.whatsappDisplay}`}
          className="inline-flex items-center gap-1.5 text-brand-blue"
        >
          <WhatsappIcon aria-hidden="true" />
          WhatsApp
        </a>
        <a
          href={buildMailtoUrl()}
          aria-label={`Email Dr. Gutka Support: ${SUPPORT_CONTACT.email}`}
          className="inline-flex items-center gap-1.5 text-brand-blue"
        >
          <MailIcon aria-hidden="true" />
          Email
        </a>
      </div>
    </div>
  );
}

/**
 * The full support block shown on /support: both channels with their
 * display details, note, and a labeled call-to-action each. Gmail's
 * compose URL is offered here specifically (the highest-intent context)
 * as a secondary option alongside the universal mailto — never the only
 * way to reach the address, since not every student uses Gmail.
 */
export function SupportContactCard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="hm-card flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-brand-blue">
          <WhatsappIcon width="22" height="22" aria-hidden="true" />
          <h2 className="text-base font-bold text-[var(--color-text)]">WhatsApp Support</h2>
        </div>
        <div>
          <p className="text-lg font-bold text-[var(--color-text)]">{SUPPORT_CONTACT.whatsappDisplay}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{SUPPORT_CONTACT.whatsappNote}</p>
        </div>
        <a
          href={buildWhatsappUrl("Hello Dr. Gutka Support, I need help.")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat with Dr. Gutka Support on WhatsApp: ${SUPPORT_CONTACT.whatsappDisplay}`}
          className="mt-1 inline-flex items-center justify-center rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-bold text-white"
        >
          Chat on WhatsApp
        </a>
      </section>

      <section className="hm-card flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-brand-blue">
          <MailIcon width="22" height="22" aria-hidden="true" />
          <h2 className="text-base font-bold text-[var(--color-text)]">Email Support</h2>
        </div>
        <p className="text-lg font-bold text-[var(--color-text)]">{SUPPORT_CONTACT.email}</p>
        <a
          href={buildMailtoUrl()}
          aria-label={`Email Dr. Gutka Support: ${SUPPORT_CONTACT.email}`}
          className="mt-1 inline-flex items-center justify-center rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-bold text-white"
        >
          Email Support
        </a>
        <a
          href={buildGmailUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-xs font-semibold text-[var(--color-text-muted)] underline underline-offset-2"
        >
          Prefer Gmail? Open compose in Gmail instead
        </a>
      </section>
    </div>
  );
}
