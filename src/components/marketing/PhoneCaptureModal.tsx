"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { subscribeWhatsApp } from "@/lib/api/marketing";

const DISMISS_KEY = "mak_phone_popup_dismissed";
const SUBSCRIBED_KEY = "mak_phone_popup_subscribed";
const USER_PHONE_KEY = "mak_user_phone";
const USER_NAME_KEY = "mak_user_name";
const DISMISS_COOLDOWN_DAYS = 7;

export function PhoneCaptureModal() {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const countryCode = "+91";
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Never render on admin pages, login, checkout, or design-system preview
  const isExcludedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/design-system");

  useEffect(() => {
    if (isExcludedRoute) return;

    try {
      const isSubscribed = localStorage.getItem(SUBSCRIBED_KEY);
      if (isSubscribed) return;

      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const diffMs = Date.now() - parseInt(dismissedAt, 10);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays < DISMISS_COOLDOWN_DAYS) {
          return;
        }
      }

      // Show after 6 seconds of browsing
      const timer = setTimeout(() => {
        setOpen(true);
      }, 6000);

      return () => clearTimeout(timer);
    } catch {
      // localStorage may be unavailable
    }
  }, [isExcludedRoute]);

  const handleDismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // Ignore storage errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/[^\d]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    const fullPhone = `${countryCode}${cleanPhone}`;
    setSubmitting(true);

    try {
      await subscribeWhatsApp({
        phone: fullPhone,
        name: name.trim() || undefined,
        source: "popup",
      });

      try {
        localStorage.setItem(SUBSCRIBED_KEY, "true");
        localStorage.setItem(USER_PHONE_KEY, fullPhone);
        if (name.trim()) {
          localStorage.setItem(USER_NAME_KEY, name.trim());
        }
      } catch {
        // Ignore storage errors
      }

      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
      }, 3500);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to subscribe. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || isExcludedRoute) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-modal-title"
      className="mak fixed inset-0 z-120 flex items-center justify-center p-4 sm:p-6 bg-[#201e1d]/70 backdrop-blur-[4px] animate-in fade-in-0 duration-200"
      onClick={handleDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-none border-2 border-[#201e1d] bg-[#f3f2f2] text-[#201e1d] shadow-[8px_8px_0px_0px_#201e1d] sm:max-w-md"
      >
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-[#ec3013]" />

        {/* Close Button - Sharp Modernist Square */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-none border-2 border-[#201e1d] bg-white text-[#201e1d] transition-colors hover:bg-[#201e1d] hover:text-white cursor-pointer"
          aria-label="Close modal"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          {submitted ? (
            /* Success State */
            <div className="py-6 text-center animate-in zoom-in-95 duration-200">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-none border-2 border-[#201e1d] bg-[#ec3013] text-white">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3
                id="phone-modal-title"
                className="font-display text-2xl font-extrabold uppercase tracking-tight text-[#201e1d] mb-2"
              >
                Access Granted.
              </h3>
              <p className="text-sm text-[#201e1d]/75 leading-relaxed max-w-xs mx-auto font-medium">
                Your exclusive welcome greeting has been dispatched to your phone.
                Welcome to the inner circle.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ec3013]">
                <span className="h-2 w-2 bg-[#ec3013] animate-ping" />
                <span>VIP Access Activated</span>
              </div>
            </div>
          ) : (
            /* Opt-in Form */
            <>
              {/* Brand Header */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-display text-2xl font-extrabold tracking-[-0.02em] text-[#201e1d]">
                    MAK
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[#ec3013]">
                    Watches
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="h-[2px] w-6 bg-[#ec3013] inline-block" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ec3013]">
                    The Inner Circle
                  </span>
                </div>

                <h2
                  id="phone-modal-title"
                  className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#201e1d] leading-none"
                >
                  Time, Delivered.
                </h2>
                <p className="mt-2 text-xs text-[#201e1d]/75 leading-relaxed">
                  Join our private collector network for secret timepiece drops,
                  collector releases, and real-time delivery tracking.
                </p>
              </div>

              {/* Benefits Checklist with 2px borders */}
              <div className="mb-6 border-y-2 border-[#201e1d]/20 py-3.5 space-y-2.5 text-xs font-semibold uppercase tracking-wider text-[#201e1d]">
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 bg-[#ec3013] shrink-0" />
                  <span>Instant VIP Welcome Greeting &amp; Secret Drops</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 bg-[#ec3013] shrink-0" />
                  <span>Early Access to Limited Edition Releases</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 bg-[#ec3013] shrink-0" />
                  <span>Real-time Order &amp; Delivery Tracking</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="border-2 border-[#ec3013] bg-[#fff2ef] p-3 text-xs font-bold text-[#ae1800]">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="vip-name"
                    className="block text-[11px] font-bold uppercase tracking-widest text-[#201e1d] mb-1.5"
                  >
                    Your Name (Optional)
                  </label>
                  <input
                    id="vip-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aditya"
                    className="w-full h-11 bg-white text-[#201e1d] border-2 border-[#201e1d] rounded-none px-3.5 text-sm placeholder:text-[#201e1d]/40 focus:outline-none focus:border-[#ec3013] transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vip-phone"
                    className="block text-[11px] font-bold uppercase tracking-widest text-[#201e1d] mb-1.5"
                  >
                    Phone Number <span className="text-[#ec3013]">*</span>
                  </label>
                  <div className="flex border-2 border-[#201e1d] bg-white focus-within:border-[#ec3013] transition-colors">
                    <div className="flex items-center border-r-2 border-[#201e1d] bg-[#eae9e9] px-3.5 text-xs font-bold text-[#201e1d] select-none">
                      <span>+91</span>
                    </div>
                    <input
                      id="vip-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      className="w-full h-11 bg-white text-[#201e1d] px-3.5 text-sm placeholder:text-[#201e1d]/40 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-[#ec3013] hover:bg-[#dd2b0f] active:bg-[#ae1800] text-white font-display font-extrabold uppercase tracking-wider text-xs rounded-none transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_#201e1d]"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin border-2 border-white border-t-transparent" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <>
                      <span>Get VIP Access</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-[11px] font-bold uppercase tracking-wider text-[#201e1d]/50 hover:text-[#201e1d] transition-colors cursor-pointer"
                  >
                    Maybe later
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
