"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

import { GA_MEASUREMENT_ID, pageview } from "@/lib/analytics";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const queryString = searchParams?.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    pageview(url);
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          /*
            The two arguments below must be quoted string literals.

            This snippet had lost its quotes -- `gtag(js, new Date())` and
            `gtag(config, , {...}` -- so the measurement id interpolation was
            gone and an empty argument slot was left behind. The browser parsed
            the injected text and threw "Failed to execute 'appendChild' on
            'Node': Unexpected token ','", taking the whole page down at layout
            level, because this renders from RootLayout.

            The id goes through JSON.stringify rather than being pasted between
            hand-written quotes: it is a build-time value, but stringify is what
            guarantees it lands as a valid JS string literal whatever it
            contains, instead of being able to terminate the literal early.
          */
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)}, {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `,
        }}
      />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
