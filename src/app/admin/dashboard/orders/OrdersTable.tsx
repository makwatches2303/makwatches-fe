import {
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { COLORS } from "../colors";
import { formatCurrency, formatDate, getStatusColor } from "./format";
import type { Order } from "./types";

export function OrdersTable({
  orders,
  search,
  onView,
  onUpdate,
}: {
  orders: Order[];
  search: string;
  onView: (order: Order) => void;
  onUpdate: (order: Order) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr style={{ backgroundColor: COLORS.primary }}>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-white">Order ID</th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-white">Customer</th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-white hidden sm:table-cell">
              Date
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-white hidden md:table-cell">
              Items
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-white">Total</th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-white">Status</th>
            <th className="px-3 py-3 text-right text-xs font-medium tracking-wider text-white">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center" style={{ color: COLORS.textMuted }}>
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${COLORS.surfaceLight}50` }}
                  >
                    <DocumentTextIcon className="w-6 h-6" style={{ color: COLORS.textMuted }} />
                  </div>
                  <p className="text-sm">No orders found</p>
                  {search && (
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                      Try adjusting your search or filters
                    </p>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr
                key={order.id}
                className="border-b transition-all duration-300 hover:bg-gray-50 group"
                style={{ borderColor: `${COLORS.surfaceLight}60` }}
              >
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-0.5">
                    <div
                      className="font-bold text-xs px-2 py-1 rounded-lg inline-block transition-all duration-300 group-hover:scale-105"
                      style={{ backgroundColor: `${COLORS.primary}15`, color: COLORS.primary }}
                    >
                      {order.orderNumber || order.id}
                    </div>
                    <span className="text-[9px] font-mono px-2" style={{ color: COLORS.textMuted }}>
                      ID: {order.id.substring(0, 10)}...
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                      style={{ backgroundColor: `${COLORS.secondary}90` }}
                    >
                      <UserIcon className="w-3.5 h-3.5" style={{ color: "white" }} />
                    </div>
                    <span
                      className="text-xs font-medium overflow-hidden text-ellipsis"
                      style={{ color: COLORS.text }}
                      title={order.customerName || order.userId}
                    >
                      {order.customerName
                        ? order.customerName.length > 18
                          ? order.customerName.slice(0, 15) + "..."
                          : order.customerName
                        : order.userId.substring(0, 8) + "..."}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-xs hidden sm:table-cell" style={{ color: COLORS.textMuted }}>
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-3 h-3" />
                    <span>{formatDate(order.createdAt).split(",")[0]}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-xs hidden md:table-cell" style={{ color: COLORS.textMuted }}>
                  <div
                    className="px-2 py-1 rounded-lg text-center"
                    style={{ backgroundColor: `${COLORS.surfaceLight}50` }}
                  >
                    {order.items.length}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span
                    className="text-xs font-semibold group-hover:scale-105 transition-transform duration-300 inline-block"
                    style={{ color: COLORS.primary }}
                  >
                    {formatCurrency(order.total)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium inline-block"
                      style={{
                        backgroundColor: getStatusColor(order.status).bg,
                        color: getStatusColor(order.status).text,
                      }}
                    >
                      {order.status}
                    </span>
                    {order.shippingInfo?.waybill ? (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1"
                        style={{ backgroundColor: `${COLORS.success}15`, color: COLORS.success }}
                        title={`AWB: ${order.shippingInfo.waybill}`}
                      >
                        🚚 {order.shippingInfo.shipmentStatus?.replace(/_/g, " ") || "Shipped"}
                      </span>
                    ) : order.shippingInfo?.shipmentError ? (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1"
                        style={{ backgroundColor: `${COLORS.error}15`, color: COLORS.error }}
                        title={order.shippingInfo.shipmentError}
                      >
                        ⚠️ Ship Failed
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => onView(order)}
                      className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110"
                      style={{ backgroundColor: `${COLORS.primary}10` }}
                      aria-label="View order"
                      title="View details"
                    >
                      <EyeIcon className="h-3.5 w-3.5" style={{ color: COLORS.primary }} />
                    </button>
                    <button
                      onClick={() => onUpdate(order)}
                      className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110"
                      style={{ backgroundColor: `${COLORS.primary}10` }}
                      aria-label="Update order"
                      title="Update status"
                    >
                      <PencilSquareIcon className="h-3.5 w-3.5" style={{ color: COLORS.primary }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
