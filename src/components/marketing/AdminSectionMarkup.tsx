"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export interface AdminSectionMarkupProps {
  sectionId:
    | "hero"
    | "marquee"
    | "stats"
    | "trust"
    | "categories"
    | "rails"
    | "craft"
    | "house"
    | "gallery"
    | "tech"
    | "poster";
  sectionNumber: string;
  title: string;
  locationBadge?: string;
  children: React.ReactNode;
}

export function AdminSectionMarkup({
  sectionId,
  sectionNumber,
  title,
  locationBadge,
  children,
}: AdminSectionMarkupProps) {
  const searchParams = useSearchParams();
  const [isAdminPreview, setIsAdminPreview] = useState(false);

  useEffect(() => {
    // Check search params or localStorage
    const param = searchParams?.get("admin_preview");
    if (param === "true" || param === "1") {
      setIsAdminPreview(true);
      try {
        localStorage.setItem("mak_admin_preview", "true");
      } catch {}
    } else if (param === "false" || param === "0") {
      setIsAdminPreview(false);
      try {
        localStorage.removeItem("mak_admin_preview");
      } catch {}
    } else {
      try {
        if (localStorage.getItem("mak_admin_preview") === "true") {
          setIsAdminPreview(true);
        }
      } catch {}
    }
  }, [searchParams]);

  if (!isAdminPreview) {
    return <>{children}</>;
  }

  const adminBaseUrl =
    typeof window !== "undefined" && window.location.hostname.includes("localhost")
      ? "http://localhost:4200"
      : "https://admin.makwatches.in";

  const editUrl = `${adminBaseUrl}/dashboard/home?section=${sectionId}`;

  return (
    <section className="relative group/markup border-2 border-dashed border-amber-400/60 bg-amber-400/[0.02] transition-colors hover:border-amber-500">
      {/* Interactive Admin Badge */}
      <div className="absolute left-3 top-3 z-40 flex items-center gap-2 rounded-md border border-amber-400/80 bg-neutral-950/95 px-2.5 py-1 text-xs text-white shadow-xl backdrop-blur-md transition-transform group-hover/markup:scale-[1.01]">
        <span className="flex size-4.5 shrink-0 items-center justify-center rounded bg-amber-500 text-[10px] font-mono font-bold text-black">
          #{sectionNumber}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-white tracking-tight">{title}</span>
          {locationBadge ? (
            <span className="hidden sm:inline-block rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-mono font-medium text-amber-300">
              {locationBadge}
            </span>
          ) : null}
        </div>
        <a
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 inline-flex items-center gap-1 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black transition-all hover:bg-amber-400 shadow-xs"
          title={`Edit ${title} in Admin Homepage Studio`}
        >
          <span>Edit in Studio</span>
          <span>↗</span>
        </a>
      </div>

      {children}
    </section>
  );
}

/** Floating toolbar at bottom of screen when Admin Preview is active */
export function AdminPreviewToolbar() {
  const searchParams = useSearchParams();
  const [isAdminPreview, setIsAdminPreview] = useState(false);

  useEffect(() => {
    const param = searchParams?.get("admin_preview");
    if (param === "true" || param === "1") {
      setIsAdminPreview(true);
    } else if (param === "false" || param === "0") {
      setIsAdminPreview(false);
    } else {
      try {
        if (localStorage.getItem("mak_admin_preview") === "true") {
          setIsAdminPreview(true);
        }
      } catch {}
    }
  }, [searchParams]);

  // If inside an iframe (like the admin live preview), do not render toolbar to avoid obscuring content
  const isFramed = typeof window !== "undefined" && window.self !== window.top;
  if (!isAdminPreview || isFramed) return null;

  const adminBaseUrl =
    typeof window !== "undefined" && window.location.hostname.includes("localhost")
      ? "http://localhost:4200"
      : "https://admin.makwatches.in";

  function handleExit() {
    try {
      localStorage.removeItem("mak_admin_preview");
    } catch {}
    setIsAdminPreview(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("admin_preview");
      window.location.href = url.pathname;
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-lg border border-amber-400/60 bg-neutral-950/95 px-3 py-1.5 text-xs text-white shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">Inspector ON</span>
      </div>
      <a
        href={`${adminBaseUrl}/dashboard/home`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-black hover:bg-amber-400 transition-colors"
      >
        Homepage Studio ↗
      </a>
      <button
        type="button"
        onClick={handleExit}
        className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
      >
        Exit ✕
      </button>
    </div>
  );
}
