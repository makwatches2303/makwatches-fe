import { DocumentTextIcon, CreditCardIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { COLORS } from "../colors";
import { formatCurrency, formatDate, getPaymentStatusColor, getStatusColor } from "./format";
import type { Order } from "./types";

const cardStyle = {
  borderColor: `${COLORS.surfaceLight}80`,
  backgroundColor: COLORS.surface,
};

/** Order number, id, customer, date, total, and status -- the left card. */
function OrderSummaryCard({ order }: { order: Order }) {
  return (
    <div className="p-3 rounded-lg border" style={cardStyle}>
      <div className="flex items-center space-x-2 mb-2">
        <DocumentTextIcon className="w-4 h-4" style={{ color: COLORS.primary }} />
        <h4 className="text-sm font-medium" style={{ color: COLORS.text }}>
          Order Information
        </h4>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex">
          <span className="w-24" style={{ color: COLORS.textMuted }}>
            Order No:
          </span>
          <span className="font-bold" style={{ color: COLORS.primary }}>
            {order.orderNumber || order.id}
          </span>
        </div>
        <div className="flex">
          <span className="w-24" style={{ color: COLORS.textMuted }}>
            Order ID:
          </span>
          <span className="font-mono text-[10px]" style={{ color: COLORS.textMuted }}>
            {order.id}
          </span>
        </div>
        <div className="flex">
          <span className="w-24" style={{ color: COLORS.textMuted }}>
            Customer ID:
          </span>
          <span className="font-mono" style={{ color: COLORS.text }}>
            {order.userId}
          </span>
        </div>
        <div className="flex">
          <span className="w-24" style={{ color: COLORS.textMuted }}>
            Date:
          </span>
          <span style={{ color: COLORS.text }}>{formatDate(order.createdAt)}</span>
        </div>
        <div className="flex">
          <span className="w-24" style={{ color: COLORS.textMuted }}>
            Total:
          </span>
          <span className="font-semibold" style={{ color: COLORS.primary }}>
            {formatCurrency(order.total)}
          </span>
        </div>
        <div className="flex">
          <span className="w-24" style={{ color: COLORS.textMuted }}>
            Status:
          </span>
          <span
            className="px-2 rounded-full text-xs"
            style={{
              backgroundColor: getStatusColor(order.status).bg,
              color: getStatusColor(order.status).text,
            }}
          >
            {order.status.toUpperCase()}
          </span>
        </div>
        <div className="flex">
          <span className="w-24" style={{ color: COLORS.textMuted }}>
            Payment:
          </span>
          <span
            className="px-2 rounded-full text-xs border"
            style={{
              backgroundColor: getPaymentStatusColor(order.paymentStatus).bg,
              color: getPaymentStatusColor(order.paymentStatus).text,
              borderColor: getPaymentStatusColor(order.paymentStatus).border,
            }}
          >
            {(order.paymentStatus || "unpaid").toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

function PaymentCard({ order }: { order: Order }) {
  return (
    <div className="p-3 rounded-lg border" style={cardStyle}>
      <div className="flex items-center space-x-2 mb-2">
        <CreditCardIcon className="w-4 h-4" style={{ color: COLORS.primary }} />
        <h4 className="text-sm font-medium" style={{ color: COLORS.text }}>
          Payment Details
        </h4>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex">
          <span className="w-24" style={{ color: COLORS.textMuted }}>
            Method:
          </span>
          <span style={{ color: COLORS.text }}>{order.paymentInfo.method}</span>
        </div>
        {order.paymentInfo.razorpayOrderId && (
          <div className="flex">
            <span className="w-24" style={{ color: COLORS.textMuted }}>
              Razorpay ID:
            </span>
            <span className="font-mono text-[10px]" style={{ color: COLORS.text }}>
              {order.paymentInfo.razorpayOrderId}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ShippingAddressCard({ order }: { order: Order }) {
  return (
    <div className="p-3 rounded-lg border" style={cardStyle}>
      <div className="flex items-center space-x-2 mb-2">
        <MapPinIcon className="w-4 h-4" style={{ color: COLORS.primary }} />
        <h4 className="text-sm font-medium" style={{ color: COLORS.text }}>
          Shipping Address
        </h4>
      </div>

      <div className="text-xs" style={{ color: COLORS.text }}>
        <p>{order.shippingAddress.street}</p>
        <p>
          {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
          {order.shippingAddress.zipCode}
        </p>
        <p>{order.shippingAddress.country}</p>
      </div>
    </div>
  );
}

function PickupDetailsCard({ order }: { order: Order }) {
  if (!order.pickupDetails) return null;
  const pickup = order.pickupDetails;

  return (
    <div className="p-3 rounded-lg border" style={cardStyle}>
      <div className="flex items-center space-x-2 mb-2">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke={COLORS.primary}
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <h4 className="text-sm font-medium" style={{ color: COLORS.text }}>
          Pickup/Seller Location
        </h4>
      </div>

      <div className="text-xs space-y-1" style={{ color: COLORS.text }}>
        {pickup.locationName && <p className="font-medium">{pickup.locationName}</p>}
        {pickup.sellerName && <p>{pickup.sellerName}</p>}
        {pickup.address && <p>{pickup.address}</p>}
        {(pickup.city || pickup.state || pickup.pincode) && (
          <p>
            {pickup.city && `${pickup.city}, `}
            {pickup.state && `${pickup.state} `}
            {pickup.pincode}
          </p>
        )}
        {pickup.country && <p>{pickup.country}</p>}
        {pickup.phone && (
          <p className="mt-1.5" style={{ color: COLORS.textMuted }}>
            📞 {pickup.phone}
          </p>
        )}
        {pickup.gstNumber && <p style={{ color: COLORS.textMuted }}>GST: {pickup.gstNumber}</p>}
      </div>
    </div>
  );
}

/** The order-info / payment / shipping-address / pickup card grid. */
export function OrderInfoCards({ order }: { order: Order }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <OrderSummaryCard order={order} />
      <div className="space-y-3">
        <PaymentCard order={order} />
        <ShippingAddressCard order={order} />
        <PickupDetailsCard order={order} />
      </div>
    </div>
  );
}
