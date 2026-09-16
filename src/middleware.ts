import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes for customers
const customerProtectedRoutes = [
  "/account",
  "/cart",
  "/checkout",
  "/orders",
  "/favourite",
];

// Public pages where logged-in users should NOT go again
const customerAuthPages = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Either cookie counts as a signed-in shopper.
  //
  // An admin-role account signing in through this storefront is still a
  // person with an account page and an order history, and both sign-in paths
  // store their JWT under "adminToken" for such an account (see
  // AuthContext.login and auth/callback/page.tsx). Checking only
  // "customerToken" here bounced them straight back to /login every time they
  // opened /account -- while the client-side AuthContext, which reads either
  // token, happily showed them as signed in. The gate and the UI disagreed,
  // which reads as "login doesn't work" even though it did.
  const sessionToken =
    req.cookies.get("customerToken")?.value ?? req.cookies.get("adminToken")?.value;

  // Customer protected routes
  if (customerProtectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!sessionToken) {
      return authRedirect(new URL("/login", req.url));
    }
  }

  // Prevent logged-in customer from visiting login/register again
  if (customerAuthPages.includes(pathname) && sessionToken) {
    return authRedirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

/**
 * A redirect that depends on the session, marked so nothing may reuse it.
 *
 * This is the fix for "clicking Orders sends a signed-in customer to /login".
 *
 * Next prefetches every <Link> it renders, and the footer carries a "Track
 * order" link to /orders on every page. A visitor who is not signed in
 * therefore prefetches /orders, and this middleware answers 307 -> /login. That
 * answer was being emitted with **no Cache-Control and no Vary**, while the
 * signed-in 200 carries `Vary: rsc, ...` and `Cache-Control: no-store`. A
 * response that varies by cookie but does not say so is free to be reused: the
 * client router kept the signed-out redirect keyed on the URL, and replayed it
 * after the customer signed in. Hence "sometimes" -- it depended entirely on
 * whether a prefetch had happened while signed out.
 *
 * `Vary: Cookie` states the dependency, and `no-store` keeps the browser, the
 * router cache and any intermediary from holding it at all.
 */
function authRedirect(destination: URL): NextResponse {
  const res = NextResponse.redirect(destination);
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  res.headers.set("Vary", "Cookie");
  return res;
}

// Define routes where middleware should run
export const config = {
  matcher: [
    /*
      Subtrees, not bare parents.

      These were exact paths, so the guard ran on "/orders" but never on
      "/orders/<id>" -- an order detail page was reachable at the edge by
      anyone, and the same held for /account/addresses, /account/profile and
      /account/reviews. The `:path*` form covers the parent and everything
      beneath it, which is what `customerProtectedRoutes`' startsWith test
      already assumed was happening.
    */
    "/account/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/favourite/:path*",
    "/login",
    "/register",
  ],
};
