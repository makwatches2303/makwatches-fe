"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { apiUrl } from "@/lib/env";

// Never serve a cached shell of this page. It reads one-time query params
// (an exchange code, or an error) that only make sense the instant Google's
// redirect lands here -- a CDN-cached copy from a previous visit is not just
// stale, it's actively wrong. Response headers on this route were observed
// serving `x-vercel-cache: STALE` with `age` in the hundreds of seconds,
// which is the "old UI flashes for a second mid-login" report: an edge
// briefly serves last deploy's cached shell before revalidating.
export const dynamic = "force-dynamic";

type JwtClaims = { userId?: string; role?: string };

function decodeJwtPayload(token: string): JwtClaims | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let cancelled = false;

    async function processAuth() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const directToken = url.searchParams.get("token");
      const error = url.searchParams.get("error");

      if (error) {
        if (!cancelled) setMessage("Sign-in failed. Redirecting to login…");
        setTimeout(() => (window.location.href = "/login"), 1500);
        return;
      }

      let token = directToken;

      if (!token && code) {
        if (!cancelled) setMessage("Verifying sign-in…");
        try {
          const res = await fetch(apiUrl("/auth/exchange"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
          const data = await res.json();
          if (data?.success && data?.data?.token) {
            token = data.data.token;
          } else {
            if (!cancelled) setMessage("Sign-in expired or invalid. Redirecting to login…");
            setTimeout(() => (window.location.href = "/login"), 1500);
            return;
          }
        } catch {
          if (!cancelled) setMessage("Unable to verify sign-in. Redirecting to login…");
          setTimeout(() => (window.location.href = "/login"), 1500);
          return;
        }
      }

      if (!token) {
        if (!cancelled) setMessage("No credentials provided. Redirecting to login…");
        setTimeout(() => (window.location.href = "/login"), 1500);
        return;
      }

      const claims = decodeJwtPayload(token) || {};
      const role = String(claims.role || "user").toLowerCase();
      const userId = String(claims.userId || "");

      const isAdmin = role === "admin" || role === "administrator";
      try {
        // An admin-role account gets BOTH cookies, matching what
        // AuthContext.login already does on the password path. This page
        // used to set only "adminToken" for them, so signing in with Google
        // on an admin account left no "customerToken" -- and every visit to
        // /account, /orders or /cart was bounced to /login, because the
        // shopper-facing routes are gated on a shopper session. The account
        // still needs to browse and buy like anyone else.
        Cookies.set("customerToken", token, { expires: 7 });
        localStorage.setItem("customerToken", token);
        if (isAdmin) {
          Cookies.set("adminToken", token, { expires: 7 });
          localStorage.setItem("adminToken", token);
          sessionStorage.setItem("adminAuthToken", token);
        }
        if (userId) localStorage.setItem("userId", userId);
        sessionStorage.setItem("mak_auth_toast", "You have successfully signed in. Welcome back!");
      } catch {
        // ignore persistence errors
      }

      // Admin has its own separate app now; this storefront has no admin
      // destination to send an admin account to.
      const dest = "/";
      if (!cancelled) setMessage("Signed in! Redirecting…");
      window.location.replace(dest);
    }

    processAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-mak-bg">
      <div className="max-w-md w-full text-center text-mak-ink">
        <div className="text-xl font-display font-extrabold">{message}</div>
      </div>
    </div>
  );
}
