"use client";

import { Newsletter, PosterCTA } from "@/components/marketing";
import { subscribeEmail } from "@/lib/api/marketing";
import { getErrorMessage } from "@/lib/errors";
import type { PosterContent } from "@/lib/api/storefront";

/**
 * The closing poster band.
 *
 * The accent runs as a full field here, which the reference reserves for
 * exactly one place on a page.
 *
 * The signup used to render with no `onSubmit`, which put Newsletter into its
 * disabled state and printed "Signup is not connected yet." -- correct at the
 * time, because the only subscriber endpoint took a phone number and answered
 * by dispatching a WhatsApp template. Pointing an email field at that would
 * have failed validation on every submission, and had it succeeded it would
 * have messaged people who never gave a phone number.
 *
 * It now posts to POST /api/v1/subscribers/email, which stores the address and
 * sends nothing. Errors are surfaced rather than swallowed: Newsletter shows
 * the rejection when this promise rejects, so a failed save never renders as a
 * confirmation.
 */
export function HomeNewsletter({ content }: { content: PosterContent }) {
  const handleSubscribe = async (email: string) => {
    try {
      const result = await subscribeEmail({ email, source: "homepage_poster" });
      // A 200 carrying success:false is still a failure. Throwing here is what
      // keeps the form from showing "You are on the list." over a save that
      // did not happen.
      if (!result?.success) {
        throw new Error(result?.message || "Could not save your subscription.");
      }
    } catch (error) {
      throw new Error(
        getErrorMessage(error, "Could not save your subscription. Please try again.")
      );
    }
  };

  return (
    <PosterCTA
      headline={content.headlineLines.map((line, index) => (
        <span key={line} className="block uppercase">
          {line}
          {index < content.headlineLines.length - 1 ? <br /> : null}
        </span>
      ))}
      body={content.body}
      aside={
        <Newsletter
          label={content.emailLabel}
          submitLabel={content.submitLabel}
          note={content.note}
          onSubmit={handleSubscribe}
        />
      }
    />
  );
}
