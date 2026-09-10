import { ShoppingBagIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { COLORS } from "../colors";
import { formatCurrency } from "./format";
import type { Order } from "./types";

export function OrderItemsTable({ order }: { order: Order }) {
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: `${COLORS.surfaceLight}80` }}>
      <div
        className="px-3 py-2 border-b"
        style={{ backgroundColor: COLORS.surface, borderColor: `${COLORS.surfaceLight}80` }}
      >
        <div className="flex items-center space-x-2">
          <ShoppingBagIcon className="w-4 h-4" style={{ color: COLORS.primary }} />
          <h4 className="text-sm font-medium" style={{ color: COLORS.text }}>
            Order Items
          </h4>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y" style={{ borderColor: `${COLORS.surfaceLight}60` }}>
          <thead style={{ backgroundColor: `${COLORS.surface}50` }}>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium tracking-wider" style={{ color: COLORS.textMuted }}>
                Image
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium tracking-wider" style={{ color: COLORS.textMuted }}>
                Product
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium tracking-wider" style={{ color: COLORS.textMuted }}>
                Price
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium tracking-wider" style={{ color: COLORS.textMuted }}>
                Qty
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium tracking-wider" style={{ color: COLORS.textMuted }}>
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: `${COLORS.surfaceLight}40` }}>
            {order.items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-12 h-12 object-cover rounded-lg border"
                      style={{ borderColor: COLORS.inputBorder }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 flex items-center justify-center text-[10px] rounded-lg"
                      style={{ backgroundColor: `${COLORS.surfaceLight}50`, color: COLORS.textMuted }}
                    >
                      <PhotoIcon className="h-5 w-5" />
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-xs" style={{ color: COLORS.text }}>
                  <div className="font-medium">{item.productName}</div>
                  {item.brand && (
                    <div className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>
                      Brand: {item.brand}
                    </div>
                  )}
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: COLORS.textMuted }}>
                    ID: {item.productId}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-right" style={{ color: COLORS.textMuted }}>
                  {formatCurrency(item.price)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-right" style={{ color: COLORS.textMuted }}>
                  {item.quantity}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-right" style={{ color: COLORS.primary }}>
                  {formatCurrency(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ backgroundColor: `${COLORS.surface}30` }}>
            <tr>
              <td colSpan={4} className="px-3 py-2 text-right text-xs font-medium" style={{ color: COLORS.text }}>
                Total:
              </td>
              <td className="px-3 py-2 text-xs font-bold text-right" style={{ color: COLORS.primary }}>
                {formatCurrency(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
