"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  BagIcon,
  Container,
  HeartIcon,
  IconButton,
  MenuIcon,
  SearchIcon,
} from "@/design-system";
import { AccountMenu } from "@/components/commerce";
import { selectCartCount, useCartStore } from "@/store/cart";
import { selectWishlistCount, useWishlistStore } from "@/store/wishlist";
import { useUIStore } from "@/store/ui";

import type { NavItem } from "@/lib/api/storefront";
import { isExternalNavItem, isNavItemActive } from "./navigation";

/**
 * The sticky site header.
 *
 * Follows the reference: wordmark left, uppercase nav centre, icon actions
 * right, over a translucent blurred ground with the 2px rule beneath.
 *
 * Mobile is a distinct composition rather than a shrunken desktop bar --
 * hamburger, wordmark, then search and bag. The full nav moves into MobileNav.
 */

export interface HeaderProps {
  /** Admin-configured primary navigation, already filtered and ordered. */
  nav: NavItem[];
  className?: string;
}

export function Header({ nav, className }: HeaderProps) {
  const pathname = usePathname();

  const cartCount = useCartStore(selectCartCount);
  const wishlistCount = useWishlistStore(selectWishlistCount);

  const openSearch = useUIStore((state) => state.openSearch);
  const openCart = useUIStore((state) => state.openCart);
  const openMobileNav = useUIStore((state) => state.openMobileNav);

  return (
    <header
      className={cn(
        "sticky top-0 z-60 border-b-2 border-mak-line",
        // Translucent with a blur, matching the reference. The fallback for
        // browsers without backdrop-filter is a solid ground, not transparency.
        "bg-mak-bg supports-[backdrop-filter]:bg-mak-bg/90 supports-[backdrop-filter]:backdrop-blur-[10px]",
        className
      )}
    >
      <Container>
        <div className="flex items-center justify-between gap-4 py-3.5">
          {/* Mobile: menu trigger. Hidden on desktop where the nav is inline. */}
          <IconButton
            label="Open menu"
            onClick={openMobileNav}
            variant="bare"
            className="-ml-2 lg:hidden"
          >
            <MenuIcon size={22} />
          </IconButton>

          <Link
            href="/"
            className="flex items-baseline gap-2 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
          >
            <span className="font-display text-2xl font-extrabold tracking-[-0.02em] text-mak-ink">
              MAK
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.42em] text-mak-accent">
              Watches
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 lg:flex"
          >
            {nav.map((item) => {
              const active = isNavItemActive(item, pathname);
              const external = isExternalNavItem(item);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-[13px] font-semibold uppercase tracking-[0.06em] no-underline",
                    "transition-colors duration-200 ease-mak",
                    "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mak-accent",
                    active
                      ? "text-mak-accent"
                      : "text-mak-ink hover:text-mak-accent"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <IconButton label="Search" onClick={openSearch}>
              <SearchIcon />
            </IconButton>

            {/*
              The account control, which now knows whether anyone is signed in.
              It was a bare link to /account, which meant this header -- the one
              every rebuilt route uses -- offered no way to sign out at all.
            */}
            <AccountMenu />

            <Link
              href="/wishlist"
              aria-label={
                wishlistCount > 0
                  ? `Wishlist, ${wishlistCount} saved`
                  : "Wishlist"
              }
              className={cn(
                "relative hidden size-11 items-center justify-center border-2 border-mak-divider text-mak-ink sm:inline-flex",
                "transition-colors duration-200 ease-mak hover:border-mak-ink hover:bg-mak-ink hover:text-mak-bg",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent",
                "[@media(pointer:fine)]:size-9"
              )}
            >
              <HeartIcon />
              {wishlistCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center bg-mak-ink px-1 font-display text-[10px] font-extrabold leading-none text-mak-bg"
                >
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>

            <IconButton
              label={cartCount > 0 ? `Bag, ${cartCount} items` : "Bag"}
              onClick={openCart}
              badge={cartCount}
              badgeTone="accent"
            >
              <BagIcon />
            </IconButton>
          </div>
        </div>
      </Container>
    </header>
  );
}
