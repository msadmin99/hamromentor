// Single source of truth for Dr. Gutka's student-facing support contact
// details. Every WhatsApp/email link in the app must build its URL from
// here — never hard-code the number or address in a component.
//
// WhatsApp deep-link format: https://wa.me/<digits-only, no +, no spaces,
// no hyphens> — see https://faq.whatsapp.com/425247423114725 (wa.me click-to-chat).
const WHATSAPP_DIGITS = "9779854024518";

export const SUPPORT_CONTACT = {
  whatsappNumber: `+${WHATSAPP_DIGITS}`,
  whatsappDisplay: "+977-9854024518",
  whatsappNote: "Message only — no calls",
  email: "help@drgutka.com",
};

/**
 * Builds a wa.me click-to-chat URL. `message`, if given, must be short,
 * generic, and free of any sensitive data (no passwords, OTPs, tokens,
 * payment details, or internal IDs) — it's a plain, user-editable
 * pre-fill, not a secure channel.
 */
export function buildWhatsappUrl(message) {
  const base = `https://wa.me/${WHATSAPP_DIGITS}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Gmail's own web compose URL — opens Gmail's compose window directly
 * when the user is on gmail.com / has it as their default web handler.
 * This is a convenience, not a guarantee: users without Gmail (Apple
 * Mail, Outlook, a different webmail) simply won't get this specific
 * experience, which is why every call site pairs this with `mailtoUrl`
 * as the universally-supported fallback rather than relying on this alone.
 */
export function buildGmailUrl(subject) {
  const params = new URLSearchParams({ view: "cm", fs: "1", to: SUPPORT_CONTACT.email });
  if (subject) params.set("su", subject);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/** Standard mailto: — works with whatever mail client the OS/browser has configured, the safe universal fallback. */
export function buildMailtoUrl(subject) {
  return subject ? `mailto:${SUPPORT_CONTACT.email}?subject=${encodeURIComponent(subject)}` : `mailto:${SUPPORT_CONTACT.email}`;
}
