"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { IconButton, UserIcon, useEscapeKey } from "@/design-system";
import { useAuth } from "@/context/AuthContext";

/**
 * The header's account control: sign in when signed out, a menu with sign-out
 * when signed in.
 *
 * ## Why this exists
 *
 * The rebuilt header shipped with a bare `<Link href="/account">` and no
 * awareness of who was signed in, so on every rebuilt route -- which is now
 * essentially the whole storefront -- there was **no way to sign out at all**.
 * The only logout lived in the legacy Navbar, which those routes do not render.
 *
 * ## The three states
 *
 * `loading` is deliberately distinct from `unauthenticated`. Rendering "Sign
 * in" while the session is still resolving makes the header flicker on every
 * refresh and invites a signed-in customer to click sign-in; so while auth is
 * resolving this stays a plain link to /account and commits to nothing.
 *
 * ## Accessibility
 *
 * A real `aria-haspopup="menu"` button with `aria-expanded`, a `role="menu"`
 * panel, Escape to close, click-outside to close, and focus returned to the
 * trigger on close. The menu items are ordinary links and one button, so
 * keyboard and screen-reader users get the same affordances as pointer users.
 */

export interface AccountMenuProps {
  className?: string;
}

/** Where the menu can take a signed-in customer. All existing routes. */
const MENU_LINKS = [
  { href: "/account", label: "My account" },
  { href: "/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/wishlist", label: "Wishlist" },
] as const;

export function AccountMenu({ className }: AccountMenuProps) {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Return focus to the trigger after the menu closes.
   *
   * Scoped to the container rather than held as a ref because IconButton is a
   * plain function component, not a forwardRef, and its props type excludes
   * `ref` -- changing the design-system primitive for this would be a wider
   * blast radius than the problem deserves. The trigger is the first button
   * inside the container in DOM order, so this is unambiguous.
   */
  const focusTrigger = () => {
    containerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  };

  const signedIn = !loading && Boolean(user);

  useEscapeKey(open, () => {
    setOpen(false);
    // Focus goes back where it came from, or the menu strands the keyboard.
    focusTrigger();
  });

  // Click outside closes. Pointerdown rather than click so it fires before a
  // link inside another component steals the interaction.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // While auth resolves, and when signed out, this is a plain link. No menu to
  // open and nothing to assert about the visitor.
  if (!signedIn) {
    return (
      <Link
        href={loading ? "/account" : "/login"}
        aria-label={loading ? "Account" : "Sign in"}
        className={cn(
          "hidden size-11 items-center justify-center border-2 border-mak-divider text-mak-ink sm:inline-flex",
          "transition-colors duration-200 ease-mak hover:border-mak-ink hover:bg-mak-ink hover:text-mak-bg",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent",
          "[@media(pointer:fine)]:size-9",
          className
        )}
      >
        <UserIcon />
      </Link>
    );
  }

  const identity = user?.name?.trim() || user?.email?.trim() || "Your account";

  return (
    <div ref={containerRef} className={cn("relative hidden sm:block", className)}>
      <IconButton
        label={`Account menu for ${identity}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(open && "border-mak-ink bg-mak-ink text-mak-bg")}
      >
        <UserIcon />
      </IconButton>

      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className={cn(
            "absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60",
            "border-2 border-mak-line bg-mak-bg shadow-lg"
          )}
        >
          <div className="border-b-2 border-mak-divider px-4 py-3">
            <p className="text-mak-micro uppercase tracking-[0.14em] text-mak-subtle">
              Signed in as
            </p>
            {/* break-all: an email is one long token and would otherwise widen
                the panel past its own box. */}
            <p className="mt-1 break-all font-display text-mak-small font-extrabold text-mak-ink">
              {identity}
            </p>
          </div>

          <ul className="flex list-none flex-col p-0">
            {MENU_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block px-4 py-2.5 text-mak-small text-mak-ink no-underline",
                    "transition-colors duration-200 ease-mak hover:bg-mak-surface hover:text-mak-accent",
                    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mak-accent"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t-2 border-mak-divider">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className={cn(
                "w-full px-4 py-3 text-left font-display text-mak-label font-extrabold uppercase tracking-[0.12em]",
                "text-mak-accent transition-colors duration-200 ease-mak hover:bg-mak-accent hover:text-mak-on-accent",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mak-accent"
              )}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
