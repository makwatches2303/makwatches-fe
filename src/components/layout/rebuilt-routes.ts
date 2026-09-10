/**
 * Which routes have been rebuilt onto the MAK design system.
 *
 * NavGuard and FooterGuard consult this to decide whether a route gets the new
 * chrome or the legacy Navbar and Footer. Rebuilding a route in a later phase
 * is a one-line addition here.
 *
 * This exists so the reconstruction can proceed route by route without ever
 * leaving the site in a state where some pages have no header at all.
 */

/** Exact paths, and prefixes for whole subtrees. */
const REBUILT_EXACT = new Set<string>([
  "/",
  "/shop",
  "/men",
  "/women",
  "/collections",
  "/cart",
  "/checkout",
  "/account",
  "/orders",
  "/wishlist",
  "/boutique",
  "/search",
  "/about",
  "/privacy",
  "/terms",
  "/shipping",
  "/refund",
  "/blog",
  "/contact",
]);

const REBUILT_PREFIXES: string[] = [
  // The account area is a set of real routes -- /account/addresses,
  // /orders/<id> -- rather than tabs in one page.
  "/account",
  "/orders",
  // The internal component gallery renders its own chrome.
  "/design-system",
  "/collections",
  "/category",
  "/product",
];

/** Whether a path is served by the rebuilt storefront. */
export function isRebuiltRoute(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (REBUILT_EXACT.has(path)) return true;
  return REBUILT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

/** Routes that render no site chrome at all, in either system. */
export function isChromelessRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/design-system")
  );
}
