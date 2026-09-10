"use client";

import { useEffect } from "react";
import { ErrorState } from "@/design-system";

// Next.js requires an error boundary to be a client component. Without this
// file, an uncaught render error anywhere in the app fell through to Next's
// default (unstyled) error screen instead of the site's own look.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong."
      description="We hit a snag loading this page. Try again, or head back to the homepage."
      onRetry={reset}
      className="min-h-[60vh]"
    />
  );
}
