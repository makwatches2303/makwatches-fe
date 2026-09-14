"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Button, ButtonLink, EmptyState, LoadingState } from "@/design-system";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

/**
 * The frame every account page sits in: the guard, and the sub-navigation.
 *
 * The account area is a set of real routes rather than tabs in one page, which
 * the previous implementation used. Tabs meant nothing in the account could be
 * linked to, bookmarked, or returned to with the back button -- and an order
 * someone wants to check on is exactly the thing they will want to link to.
 *
 * Auth is checked here rather than in each page, so a signed-out visitor gets
 * one consistent invitation to sign in and comes back to the page they asked
 * for.
 */

const SECTIONS = [
  { href: "/account", label: "Overview" },
  { href: "/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/reviews", label: "Reviews" },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <LoadingState label="Loading your account" />;
  }

  if (!user) {
    return (
      <EmptyState
        title="Sign in to see your account."
        description="Your orders, addresses and saved pieces live here."
        action={
          <ButtonLink href={`/login?redirect=${encodeURIComponent(pathname)}`}>
            Sign in
          </ButtonLink>
        }
      />
    );
  }

  const identity = user.name?.trim() || user.email?.trim();

  return (
    <div className="flex flex-col gap-7">
      {/*
        Who is signed in, and the way out.

        The account area is where someone goes *looking* for sign-out, so it is
        offered here as well as in the header menu -- and it is the one place
        that works on every viewport without opening a menu first.
      */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-mak-line pb-5">
        <div className="min-w-0">
          <p className="text-mak-micro uppercase tracking-[0.14em] text-mak-subtle">
            Signed in as
          </p>
          <p className="mt-1 break-all font-display text-mak-small font-extrabold text-mak-ink">
            {identity}
          </p>
        </div>
        <Button variant="secondary" onClick={logout}>
          Sign out
        </Button>
      </div>

      <div className="grid gap-9 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14">
        <AccountNav pathname={pathname} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

function AccountNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Account"
      // Horizontally scrollable on small screens rather than wrapping into a
      // ragged block; becomes a rail from lg up.
      className="-mx-5 overflow-x-auto px-5 lg:mx-0 lg:overflow-visible lg:px-0"
    >
      <ul className="flex gap-1 border-b-2 border-mak-line pb-0 lg:flex-col lg:gap-0 lg:border-b-0 lg:border-l-2 lg:pl-0">
        {SECTIONS.map((section) => {
          // /orders/<id> should still light up "Orders".
          const active =
            pathname === section.href ||
            (section.href !== "/account" &&
              pathname.startsWith(`${section.href}/`));

          return (
            <li key={section.href} className="shrink-0">
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center whitespace-nowrap px-4 no-underline",
                  "font-display text-mak-label font-extrabold uppercase tracking-[0.14em]",
                  "transition-colors duration-200 ease-mak",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mak-accent",
                  "border-b-2 lg:border-b-0 lg:border-l-2 lg:-ml-0.5",
                  active
                    ? "border-mak-accent text-mak-ink"
                    : "border-transparent text-mak-muted hover:text-mak-ink"
                )}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
