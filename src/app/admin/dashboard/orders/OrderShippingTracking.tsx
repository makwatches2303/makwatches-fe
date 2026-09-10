import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { COLORS } from "../colors";
import type { Order, TrackingData } from "./types";

export function OrderShippingTracking({
  order,
  tracking,
  trackingLoading,
  onFetchTracking,
}: {
  order: Order;
  tracking: TrackingData | undefined;
  trackingLoading: boolean;
  onFetchTracking: () => void;
}) {
  const info = order.shippingInfo;
  if (!info) return null;

  return (
    <div className="mt-4 rounded-lg border overflow-hidden" style={{ borderColor: `${COLORS.surfaceLight}80` }}>
      <div
        className="px-3 py-2 border-b flex items-center justify-between"
        style={{
          backgroundColor: info.waybill ? `${COLORS.primary}10` : `${COLORS.error}10`,
          borderColor: `${COLORS.surfaceLight}80`,
        }}
      >
        <div className="flex items-center space-x-2">
          <span className="text-base">🚚</span>
          <h4 className="text-sm font-medium" style={{ color: COLORS.text }}>
            Delhivery Shipping
          </h4>
        </div>
        {info.waybill && !tracking && (
          <button
            onClick={onFetchTracking}
            disabled={trackingLoading}
            className="px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ backgroundColor: COLORS.primary, color: "#FFF" }}
          >
            {trackingLoading ? (
              <>
                <ArrowPathIcon className="w-3 h-3 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ArrowPathIcon className="w-3 h-3" />
                Fetch Live Tracking
              </>
            )}
          </button>
        )}
      </div>

      <div className="p-3 space-y-3">
        {info.waybill ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-2 rounded" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-[10px] mb-0.5" style={{ color: COLORS.textMuted }}>
                Waybill
              </p>
              <p className="text-xs font-mono font-medium" style={{ color: COLORS.text }}>
                {info.waybill}
              </p>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-[10px] mb-0.5" style={{ color: COLORS.textMuted }}>
                Shipment Status
              </p>
              <p className="text-xs font-medium" style={{ color: COLORS.primary }}>
                {tracking?.status ||
                  info.shipmentStatus?.replace(/_/g, " ").toUpperCase() ||
                  "PENDING"}
              </p>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-[10px] mb-0.5" style={{ color: COLORS.textMuted }}>
                Current Location
              </p>
              <p className="text-xs font-medium" style={{ color: COLORS.text }}>
                {tracking?.status_location || info.currentLocation || "—"}
              </p>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-[10px] mb-0.5" style={{ color: COLORS.textMuted }}>
                Expected Delivery
              </p>
              <p className="text-xs font-medium" style={{ color: COLORS.success }}>
                {tracking?.expected_delivery || info.expectedDelivery || "—"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: `${COLORS.error}10` }}>
            <span>⚠️</span>
            <div>
              <p className="text-xs font-medium" style={{ color: COLORS.error }}>
                Shipment Creation Failed
              </p>
              {info.shipmentError && (
                <p className="text-[10px]" style={{ color: COLORS.error }}>
                  {info.shipmentError}
                </p>
              )}
            </div>
          </div>
        )}

        {tracking?.scans && tracking.scans.length > 0 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.surfaceLight }}>
            <p className="text-xs font-medium mb-2 flex items-center gap-1" style={{ color: COLORS.text }}>
              <span>📋</span> Live Tracking History
            </p>
            <div className="relative pl-4 space-y-2 max-h-48 overflow-y-auto">
              <div
                className="absolute left-1.5 top-2 bottom-2 w-0.5 rounded"
                style={{ backgroundColor: COLORS.surfaceLight }}
              />
              {tracking.scans.map((scan, idx) => (
                <div key={idx} className="relative">
                  <div
                    className="absolute -left-2.5 top-1 w-2 h-2 rounded-full border-2"
                    style={{
                      backgroundColor: idx === 0 ? COLORS.primary : COLORS.background,
                      borderColor: idx === 0 ? COLORS.primary : COLORS.surfaceLight,
                    }}
                  />
                  <div className="ml-1">
                    <p
                      className="text-xs font-medium"
                      style={{ color: idx === 0 ? COLORS.text : COLORS.textMuted }}
                    >
                      {scan.status_detail || scan.scan_type}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px]" style={{ color: COLORS.textMuted }}>
                      <span>
                        {new Date(scan.scan_datetime).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {scan.scanned_location && <span>• {scan.scanned_location}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {info.trackingUrl && (
          <div className="pt-2">
            <a
              href={info.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: COLORS.surface,
                color: COLORS.primary,
                border: `1px solid ${COLORS.primary}`,
              }}
            >
              Open Delhivery Tracking →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
