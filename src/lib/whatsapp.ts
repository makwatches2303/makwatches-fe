/**
 * The WhatsApp contact link.
 *
 * # Scope
 *
 * This module builds a link. That is the whole of the website's involvement in
 * WhatsApp: tapping the button opens WhatsApp with a conversation addressed to
 * the shop and a message already typed, and the shopper sends it themselves.
 *
 * Nothing here talks to WhatsApp, and nothing here replies. Automated replies
 * are configured in the WhatsApp Business app or the Cloud API console, against
 * the same number this links to -- outside this repository, by whoever runs the
 * account. The one thing the two sides share is the opening message, which is
 * why it is a configurable constant rather than a string inlined in a
 * component: an auto-reply rule keyed on its wording breaks silently if the
 * button's wording drifts. See GREETING below.
 *
 * # Configuration
 *
 *   NEXT_PUBLIC_WHATSAPP_NUMBER   the shop's WhatsApp number, any format
 *   NEXT_PUBLIC_WHATSAPP_MESSAGE  the pre-filled opening message
 *
 * Both are optional and both have shipped defaults, unlike the API origin
 * (see src/lib/env.ts, which throws rather than guess). The difference is what
 * a wrong answer costs: guessing an API origin points local traffic at
 * production, while a missing WhatsApp number would only mean the shop's own
 * published number goes unlinked. A button that quietly disappears in
 * production because a variable was not carried across is the worse failure.
 *
 * Next inlines `process.env.NEXT_PUBLIC_*` at build time, so each one must be
 * read as a literal member expression -- never `process.env[name]`.
 */

/**
 * The number to use when none is configured.
 *
 * The shop's real published number, so the button works on a deployment that
 * never set the variable.
 */
export const FALLBACK_WHATSAPP_NUMBER = "9974959693";

/**
 * India's country calling code.
 *
 * The catalogue ships to India and the number above is Indian; this is not a
 * general-purpose international normalizer, and is deliberately named for what
 * it actually handles.
 */
const INDIA_COUNTRY_CODE = "91";

/** Digits in an Indian subscriber number, without the country code. */
const INDIA_SUBSCRIBER_DIGITS = 10;

/**
 * The opening message, and the contract with WhatsApp Business.
 *
 * Whoever configures automated replies matches on this text. Changing it here
 * without changing the rule there turns the auto-reply off with no error
 * anywhere -- the message still sends, and the shopper simply waits for a human.
 * Override it per environment with NEXT_PUBLIC_WHATSAPP_MESSAGE, and change the
 * rule in the same breath.
 */
export const DEFAULT_WHATSAPP_GREETING =
  "Hi MAK Watches! 👋 I’m looking to buy a watch and would love your help in finding the right one. Could you please recommend some options based on my preferred style, budget, and whether it’s for men, women, or a gift? Thank you!";

/**
 * Normalize a number to the form WhatsApp addresses conversations by: country
 * code and subscriber digits, no punctuation, no plus sign, no leading zero.
 *
 * Accepts what a person actually types into a settings field -- "+91 99749
 * 59693", "099749 59693", "9974959693" -- because the alternative is a link
 * that opens WhatsApp on a chat with nobody, which looks like the shop
 * ignoring the customer.
 *
 * Returns null when the input cannot be an Indian mobile number, so the caller
 * can fall back rather than publish a broken link.
 */
export function toIndiaWhatsAppNumber(raw: string | undefined | null): string | null {
  if (!raw) return null;

  // Everything a human might separate digits with: spaces, dashes, brackets,
  // dots, a leading plus.
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;

  // Already carries the country code.
  if (
    digits.length === INDIA_COUNTRY_CODE.length + INDIA_SUBSCRIBER_DIGITS &&
    digits.startsWith(INDIA_COUNTRY_CODE)
  ) {
    return digits;
  }

  // A bare subscriber number.
  if (digits.length === INDIA_SUBSCRIBER_DIGITS) {
    return INDIA_COUNTRY_CODE + digits;
  }

  // The trunk prefix Indian numbers are written with domestically. "0" is for
  // dialling inside the country and is dropped in international format.
  if (
    digits.length === INDIA_SUBSCRIBER_DIGITS + 1 &&
    digits.startsWith("0")
  ) {
    return INDIA_COUNTRY_CODE + digits.slice(1);
  }

  // Anything else -- too short, too long, another country's code -- is not
  // something to guess at.
  return null;
}

/**
 * The shop's WhatsApp number in international format.
 *
 * Falls back to the shipped number when the variable is unset, empty, or holds
 * something that is not an Indian mobile number.
 */
export function whatsAppNumber(): string {
  return (
    toIndiaWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) ??
    // The fallback is a literal in this file, so it cannot itself be malformed;
    // the non-null assertion is the compiler's, not a judgement call.
    toIndiaWhatsAppNumber(FALLBACK_WHATSAPP_NUMBER)!
  );
}

/** The pre-filled opening message, overridable per environment. */
export function whatsAppGreeting(): string {
  const configured = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_WHATSAPP_GREETING;
}

/**
 * Build the link that opens WhatsApp with the message ready to send.
 *
 * `api.whatsapp.com/send` rather than `wa.me`: the former is WhatsApp's own
 * documented endpoint and resolves on desktop, in the mobile browser and in
 * the installed app alike. Never a `tel:` URL -- that places a phone call,
 * which is a different thing to a different inbox.
 *
 * The message is percent-encoded rather than form-encoded, so a space arrives
 * as %20. `+` would also be correct in a query string, but WhatsApp's clients
 * have been inconsistent about it and a literal plus in a greeting is a
 * confusing thing to debug.
 */
export function whatsAppUrl(
  options: { number?: string; message?: string } = {}
): string {
  const number = options.number ?? whatsAppNumber();
  const message = options.message ?? whatsAppGreeting();

  return `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(message)}`;
}
