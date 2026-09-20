"use client";

import { usePathname } from "next/navigation";

import { WhatsAppFab } from "@/components/marketing/WhatsAppFab";
import { isChromelessRoute } from "./layout/rebuilt-routes";

/**
 * Decides where the WhatsApp button appears. Mirrors NavGuard and FooterGuard.
 *
 * The button is site-wide, so it is mounted once in the root layout rather than
 * per page. Two routes are excluded and one is nudged:
 *
 *   - Chromeless routes (/login, /design-system) get no site furniture at all
 *     by definition, and this is site furniture.
 *   - Product pages on a phone carry the sticky purchase bar across the bottom
 *     of the screen (PurchasePanel, `fixed inset-x-0 bottom-0`, z-70), which
 *     would sit on top of the button in its default corner. Raising the button
 *     above the bar is better than raising it above in z-order, which would put
 *     it over "Add to bag" -- the one control on that page that matters more.
 *     From `lg` up the bar is gone and the default corner applies again.
 *
 * The nudge only moves the *default*. Once a shopper has dragged the button, the
 * position they chose wins on every page, which is the point of it being
 * draggable.
 */
export default function WhatsAppGuard() {
  const pathname = usePathname() || "";

  if (isChromelessRoute(pathname)) return null;

  const onProductPage = pathname.startsWith("/product");

  return <WhatsAppFab className={onProductPage ? "bottom-28 lg:bottom-5" : undefined} />;
}
