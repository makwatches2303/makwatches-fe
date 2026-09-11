"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart";
import { useAuth } from "@/context/AuthContext";
import { trackCartActivity } from "@/lib/api/marketing";

const USER_PHONE_KEY = "mak_user_phone";
const USER_NAME_KEY = "mak_user_name";

/**
 * Hook that monitors cart activity and syncs active cart lines with the backend
 * for abandoned cart recovery notifications via WhatsApp.
 */
export function useCartTracker() {
  const lines = useCartStore((state) => state.lines);
  const hydrated = useCartStore((state) => state.hydrated);
  const { user } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        let phone = "";
        let customerName = "";

        if (typeof window !== "undefined") {
          phone = localStorage.getItem(USER_PHONE_KEY) || "";
          customerName = localStorage.getItem(USER_NAME_KEY) || "";
        }

        if (user?.name && !customerName) {
          customerName = user.name;
        }

        if (!phone) {
          // If no phone captured yet, we cannot track for WhatsApp recovery
          return;
        }

        const total = lines.reduce(
          (sum, line) => sum + line.price * line.quantity,
          0
        );

        const items = lines.map((line) => ({
          productId: line.productId,
          name: line.name,
          price: line.price,
          quantity: line.quantity,
          size: line.size,
        }));

        await trackCartActivity({
          phone,
          customerName,
          items,
          total,
        });
      } catch {
        // Silently fail: analytics/tracking should never disrupt user experience
      }
    }, 3000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [lines, hydrated, user]);
}
