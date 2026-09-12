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

  // Read cookies (tokens)
  const customerToken = req.cookies.get("customerToken")?.value;

  // Customer protected routes
  if (customerProtectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!customerToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Prevent logged-in customer from visiting login/register again
  if (customerAuthPages.includes(pathname) && customerToken) {
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
