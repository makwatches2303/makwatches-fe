"use client";

import { useEffect } from "react";
import { trackSearch } from "@/lib/analytics";

export function SearchTracker({ query, total }: { query: string; total: number }) {
  useEffect(() => {
    if (query) {
      trackSearch(query, total);
    }
  }, [query, total]);

  return null;
}
