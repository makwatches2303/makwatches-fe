import type { Metadata } from "next";

// page.tsx here is a client component (interactive sign in/sign up form),
// and only a server component (this layout) can export metadata.
export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your MAK Watches account, or create a new one.",
  alternates: { canonical: "/login" },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
