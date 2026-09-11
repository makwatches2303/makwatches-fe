"use client";

import { PhoneCaptureModal } from "./PhoneCaptureModal";
import { useCartTracker } from "@/hooks/useCartTracker";

export function MarketingProviders() {
  useCartTracker();

  return <PhoneCaptureModal />;
}
