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
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Prevent logged-in customer from visiting login/register again
  if (customerAuthPages.includes(pathname) && sessionToken) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Define routes where middleware should run
export const config = {
  matcher: [
    // Customer
    "/account",
    "/cart",
    "/checkout",
    "/orders",
    "/favourite",
    "/login",
    "/register",
  ],
};
