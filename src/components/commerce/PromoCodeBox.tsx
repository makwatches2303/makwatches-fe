"use client";

import { useState } from "react";
import { FiCheck, FiTag, FiX } from "react-icons/fi";

import { Button, formatPrice, useToast } from "@/design-system";
import { validateCoupon } from "@/lib/api/checkout";
import {
  selectAppliedCoupon,
  useCartStore,
} from "@/store/cart";

export function PromoCodeBox({ subtotal }: { subtotal: number }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appliedCoupon = useCartStore(selectAppliedCoupon);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);
  const { toast } = useToast();

  async function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter a coupon code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await validateCoupon({ code: trimmed, subtotal });
      if (res.valid) {
        applyCoupon({
          code: res.code,
          description: res.description,
          discountType: res.discountType,
          discountValue: res.discountValue,
          discountAmount: res.discountAmount,
        });
        setCode("");
        toast(`Promo code applied: ${formatPrice(res.discountAmount)} savings!`, { tone: "success" });
      } else {
        setError(res.message || "Invalid coupon code");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Could not validate coupon code";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (appliedCoupon) {
    return (
      <div className="rounded border border-emerald-600/30 bg-emerald-500/10 p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
              <FiCheck className="h-3 w-3" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-mak-ink">
                  {appliedCoupon.code}
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  (-{formatPrice(appliedCoupon.discountAmount)})
                </span>
              </div>
              {appliedCoupon.description && (
                <p className="text-[11px] text-mak-muted line-clamp-1">
                  {appliedCoupon.description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              removeCoupon();
              toast("Promo code removed", { tone: "default" });
            }}
            className="flex items-center gap-1 text-xs text-mak-muted hover:text-red-600 transition-colors p-1"
            title="Remove coupon"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Promo code (e.g. WELCOME10)"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleApply();
              }
            }}
            className="w-full rounded border border-mak-line bg-mak-surface px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-mak-ink placeholder:text-mak-subtle focus:border-mak-ink focus:outline-none"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="shrink-0 text-xs px-3"
        >
          {loading ? "..." : "Apply"}
        </Button>
      </div>
      {error && (
        <span className="text-[11px] text-red-600 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
