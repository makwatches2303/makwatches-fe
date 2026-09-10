"use client";

import { useEffect } from "react";
import { ErrorState } from "@/design-system";

export default function CategoryError({
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
      title="Couldn't load this category."
      description="Something went wrong fetching these products. Try again."
      onRetry={reset}
      className="min-h-[50vh]"
    />
  );
}
