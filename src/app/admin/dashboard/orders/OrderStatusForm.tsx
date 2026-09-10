import { DocumentTextIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { COLORS } from "../colors";
import type { Order } from "./types";

export function OrderStatusForm({
  orders,
  updateOrderId,
  newStatus,
  onNewStatusChange,
  newPaymentStatus,
  onNewPaymentStatusChange,
  onCancel,
  onSubmit,
}: {
  orders: Order[];
  updateOrderId: string;
  newStatus: string;
  onNewStatusChange: (value: string) => void;
  newPaymentStatus: string;
  onNewPaymentStatusChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const order = orders.find((o) => o.id === updateOrderId);

  return (
    <div
      className="mb-5 rounded-xl shadow-md overflow-hidden border animate-fade-in"
      style={{
        backgroundColor: COLORS.background,
        borderColor: `${COLORS.surfaceLight}60`,
      }}
    >
      <div
        className="px-4 py-3 border-b flex justify-between items-center"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: `${COLORS.surfaceLight}80`,
        }}
      >
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="w-4 h-4" style={{ color: COLORS.primary }} />
          <h3 className="text-sm font-semibold" style={{ color: COLORS.primary }}>
            Update Order Status
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" style={{ color: COLORS.textMuted }} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-4">
        <div className="mb-3">
          <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>
            Order
          </p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold" style={{ color: COLORS.primary }}>
              {order?.orderNumber || updateOrderId}
            </p>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{ backgroundColor: COLORS.surface, color: COLORS.textMuted }}
            >
              {updateOrderId.substring(0, 12)}...
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs mb-1.5" style={{ color: COLORS.textMuted }}>
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => onNewStatusChange(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm transition-all duration-300"
              style={{
                backgroundColor: COLORS.inputBg,
                borderColor: COLORS.inputBorder,
                border: `1px solid ${COLORS.inputBorder}`,
                color: COLORS.text,
                outline: "none",
              }}
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: COLORS.textMuted }}>
              Payment Status (optional)
            </label>
            <select
              value={newPaymentStatus}
              onChange={(e) => onNewPaymentStatusChange(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm transition-all duration-300"
              style={{
                backgroundColor: COLORS.inputBg,
                borderColor: COLORS.inputBorder,
                border: `1px solid ${COLORS.inputBorder}`,
                color: COLORS.text,
                outline: "none",
              }}
            >
              <option value="">No change</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="flex gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: COLORS.inputBorder, color: COLORS.textMuted }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 rounded-lg text-white text-sm transition-all duration-300 hover:shadow"
              style={{ backgroundColor: COLORS.primary }}
            >
              Update
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
