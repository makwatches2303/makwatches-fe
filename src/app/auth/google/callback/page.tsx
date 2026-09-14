"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/env";

// Never serve a cached shell of this page. It exists purely to forward
// Google's one-time authorization code+state to the backend
// (window.location.replace below) -- a stale cached copy is not just an
// "old UI flash", it can forward a fresh code through whatever logic an
// OLDER deployed bundle had. See auth/callback/page.tsx for the same
// STALE-cache evidence (x-vercel-cache: STALE, age in the hundreds of
// seconds) on this exact route.
export const dynamic = "force-dynamic";

export default function GoogleCallbackProxyPage() {
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Forward Google's callback (currently hitting the frontend) to the backend callback
      const search =
        typeof window !== "undefined" ? window.location.search : "";
      const base =
        getApiBaseUrl();
      const url = `${base.replace(/\/$/, "")}/auth/google/callback${search}`;
      window.location.replace(url);
    } catch (e) {
      setError("Failed to redirect to authentication server");
      console.error(e);
    } finally {
      setProcessing(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {processing ? (
          <div>
            <div className="text-xl font-semibold">Connecting to Google…</div>
            <div className="mt-4 text-sm text-gray-600">Please wait.</div>
          </div>
        ) : error ? (
          <div>
            <div className="text-xl font-semibold text-red-600">{error}</div>
            <div className="mt-4 text-sm text-gray-600">Please try again.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
