import { COLORS } from "../../colors";
import type { PaymentGateway, Settings } from "../types";

const inputStyle = {
  backgroundColor: COLORS.inputBg,
  borderColor: COLORS.inputBorder,
  color: COLORS.text,
};

export function PaymentTab({
  settings,
  newPaymentGateway,
  onNewPaymentGatewayChange,
  onAdd,
  onRemove,
  onToggle,
}: {
  settings: Settings;
  newPaymentGateway: PaymentGateway;
  onNewPaymentGatewayChange: (gateway: PaymentGateway) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onToggle: (index: number) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold border-b pb-2" style={{ color: COLORS.primary, borderColor: COLORS.surfaceLight }}>
        Payment Gateways
      </h2>

      <div className="space-y-4">
        {settings.paymentGateways.map((gateway, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border"
            style={{ borderColor: COLORS.surfaceLight, backgroundColor: COLORS.surface }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium" style={{ color: COLORS.text }}>
                    {gateway.name}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      gateway.enabled ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {gateway.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                  {gateway.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggle(index)}
                  className="p-1.5 rounded-md"
                  style={{
                    backgroundColor: gateway.enabled ? `${COLORS.error}15` : `${COLORS.primary}15`,
                    color: gateway.enabled ? COLORS.error : COLORS.primary,
                  }}
                >
                  {gateway.enabled ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => onRemove(index)}
                  className="p-1.5 rounded-md text-white"
                  style={{ backgroundColor: COLORS.error }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: COLORS.surfaceLight }}>
          <h3 className="font-medium mb-4" style={{ color: COLORS.primary }}>
            Add New Payment Gateway
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
                Gateway Name
              </label>
              <input
                type="text"
                value={newPaymentGateway.name}
                onChange={(e) => onNewPaymentGatewayChange({ ...newPaymentGateway, name: e.target.value })}
                className="w-full px-3 py-2 rounded-md border focus:outline-none"
                style={inputStyle}
                placeholder="e.g. Credit Card"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
                Description
              </label>
              <input
                type="text"
                value={newPaymentGateway.description}
                onChange={(e) =>
                  onNewPaymentGatewayChange({ ...newPaymentGateway, description: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border focus:outline-none"
                style={inputStyle}
                placeholder="e.g. Pay with Visa, MasterCard, etc."
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={onAdd} className="px-4 py-2 rounded-md text-white" style={{ backgroundColor: COLORS.primary }}>
              Add Payment Gateway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
