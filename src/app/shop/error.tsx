"use client";

import { useEffect } from "react";
import { ErrorState } from "@/design-system";

export default function ShopError({
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
      title="Couldn't load the shop."
      description="Something went wrong fetching products. Try again."
      onRetry={reset}
      className="min-h-[50vh]"
    />
  );
}
