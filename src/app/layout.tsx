import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/design-system";
import NavGuard from "@/components/NavGuard";
import FooterGuard from "@/components/FooterGuard";
import { Footer as MakFooter } from "@/components/layout/Footer";
import { fetchStorefront } from "@/lib/api/server";
import { FALLBACK_STOREFRONT } from "@/lib/api/storefront";
import PageTransition from "@/components/page-transition";
import LenisProvider from "@/components/lenis-provider";
import { MarketingProviders } from "@/components/marketing/MarketingProviders";

export const metadata: Metadata = {
  metadataBase: new URL("https://makwatches.in"),
  title: {
    default:
      "MAK Watches - Premium Luxury Watches Collection | Buy Designer Watches Online",
    template: "%s | MAK Watches",
  },
  description:
    "Discover MAK Watches - India's premier destination for luxury watches. Shop exclusive collections of men's and women's designer watches, smartwatches, sports watches, and elegant timepieces. Premium quality, authentic brands, best prices.",
  keywords: [
    "MAK Watches",
    "luxury watches India",
    "premium watches online",
    "designer watches",
    "men's watches",
    "women's watches",
    "smartwatches",
    "sports watches",
    "casual watches",
    "luxury timepieces",
    "watch collection",
    "buy watches online India",
    "authentic watches",
    "branded watches",
    "watch store India",
    "MAK Watches Instagram",
    "mak_watches.23",
  ],
  authors: [{ name: "MAK Watches" }],
  creator: "MAK Watches",
  publisher: "MAK Watches",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://makwatches.in",
    siteName: "MAK Watches",
    title: "MAK Watches - Premium Luxury Watches Collection",
    description:
      "Discover India's finest collection of luxury watches. Shop authentic designer watches for men and women with best prices and quality assurance.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MAK Watches - Premium Luxury Watch Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MAK Watches - Premium Luxury Watches Collection",
    description:
      "Discover India's finest collection of luxury watches. Shop authentic designer watches for men and women.",
    images: ["/og-image.png"],
    creator: "@makwatches",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/icon.png",
        media: "(prefers-color-scheme: light)",
        type: "image/png",
      },
      {
        url: "/icon-dark.png",
        media: "(prefers-color-scheme: dark)",
        type: "image/png",
      },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: ["/icon.png"],
    apple: [
      { url: "/apple-icon.png", sizes: "192x192", type: "image/png" },
      { url: "/apple-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  verification: {
    google: "your-google-verification-code",
    // Add your verification codes here
  },
  alternates: {
    canonical: "https://makwatches.in",
  },
  other: {
    "instagram:profile": "https://www.instagram.com/mak_watches.23",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Navigation and footer copy are admin-managed. Fetched here (cached, 60s)
  // and handed to the guards, which are client components and cannot fetch
  // themselves. Falls back to the shipped defaults if the endpoint is
  // unreachable, so a settings outage never costs the site its menus.
  const storefront = await fetchStorefront().catch(() => FALLBACK_STOREFRONT);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "MAK Watches",
    description:
      "Premium luxury watches collection - Buy authentic designer watches online",
    url: "https://makwatches.in",
    logo: "https://makwatches.in/mak-logo.svg",
    image: "https://makwatches.in/og-image.png",
    sameAs: ["https://www.instagram.com/mak_watches.23"],
    potentialAction: {
      "@type": "SearchAction",
      target: "https://makwatches.in/shop?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "250",
    },
  };

  return (
    <html lang="en" className={fontVariables}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-4RCRSM9PJT"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-4RCRSM9PJT');
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <LenisProvider>
          {/*
            ToastProvider wraps AuthProvider, not the other way around:
            AuthContext's login/register report failures through useToast(),
            and a provider can only be called from inside its own tree. The
            chrome (NavGuard/main/FooterGuard) renders as a child of both
            either way, so nothing about its own access to toast changes.
          */}
          <ToastProvider>
            <AuthProvider>
              {/* Marketing popup & cart recovery tracker */}
              <MarketingProviders />

              {/* NavGuard will hide Navbar on /login */}
              <NavGuard navigation={storefront.navigation} />

              {/* Page transition wrapper */}
              <main className="flex-grow pt-0 md:pt-0">
                <PageTransition>{children}</PageTransition>
              </main>

              {/* FooterGuard will hide Footer on /login */}
              <FooterGuard
                makFooter={
                  <MakFooter
                    tagline={storefront.footer.tagline || undefined}
                    social={storefront.footer.social}
                    columns={storefront.navigation.footer}
                  />
                }
              />
            </AuthProvider>
          </ToastProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
