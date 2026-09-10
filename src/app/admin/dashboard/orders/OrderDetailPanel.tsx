import { EyeIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { COLORS } from "../colors";
import { OrderInfoCards } from "./OrderInfoCards";
import { OrderItemsTable } from "./OrderItemsTable";
import { OrderShippingTracking } from "./OrderShippingTracking";
import type { Order, TrackingData } from "./types";

export function OrderDetailPanel({
  order,
  tracking,
  trackingLoading,
  onFetchTracking,
  onClose,
  onUpdateStatus,
}: {
  order: Order;
  tracking: TrackingData | undefined;
  trackingLoading: boolean;
  onFetchTracking: () => void;
  onClose: () => void;
  onUpdateStatus: () => void;
}) {
  return (
    <div
      className="mb-5 rounded-xl shadow-md overflow-hidden border animate-fade-in"
      style={{ backgroundColor: COLORS.background, borderColor: `${COLORS.surfaceLight}60` }}
    >
      <div
        className="px-4 py-3 border-b flex justify-between items-center"
        style={{ backgroundColor: COLORS.surface, borderColor: `${COLORS.surfaceLight}80` }}
      >
        <div className="flex items-center space-x-2">
          <EyeIcon className="w-4 h-4" style={{ color: COLORS.primary }} />
          <h3 className="text-sm font-semibold" style={{ color: COLORS.primary }}>
            Order Details
          </h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
          <XMarkIcon className="w-4 h-4" style={{ color: COLORS.textMuted }} />
        </button>
      </div>

      <div className="p-4">
        <OrderInfoCards order={order} />
        <OrderItemsTable order={order} />
        <OrderShippingTracking
          order={order}
          tracking={tracking}
          trackingLoading={trackingLoading}
          onFetchTracking={onFetchTracking}
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={onUpdateStatus}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: COLORS.primary }}
          >
            <PencilSquareIcon className="w-3.5 h-3.5" />
            <span>Update Status</span>
          </button>
        </div>
      </div>
    </div>
  );
}
