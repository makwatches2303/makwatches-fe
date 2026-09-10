"use client";

import { useEffect } from "react";
import { ErrorState } from "@/design-system";

export default function ProductError({
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
      title="Couldn't load this product."
      description="Something went wrong fetching this product's details. Try again."
      onRetry={reset}
      className="min-h-[50vh]"
    />
  );
}
