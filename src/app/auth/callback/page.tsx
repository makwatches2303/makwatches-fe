"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { apiUrl } from "@/lib/env";

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
      const tokenKey = isAdmin ? "adminToken" : "customerToken";
      try {
        Cookies.set(tokenKey, token, { expires: 7 });
        localStorage.setItem(tokenKey, token);
        if (isAdmin) sessionStorage.setItem("adminAuthToken", token);
        if (userId) localStorage.setItem("userId", userId);
        sessionStorage.setItem("mak_auth_toast", "You have successfully signed in. Welcome back!");
      } catch {
        // ignore persistence errors
      }

      const dest = isAdmin ? "/admin/dashboard" : "/";
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
