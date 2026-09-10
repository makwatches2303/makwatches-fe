import { COLORS } from "../../colors";
import type { ShippingMethod, Settings } from "../types";

const inputStyle = {
  backgroundColor: COLORS.inputBg,
  borderColor: COLORS.inputBorder,
  color: COLORS.text,
};

const CURRENCY_SYMBOL: Record<string, string> = { INR: "₹", USD: "$" };

export function ShippingTab({
  settings,
  newShippingMethod,
  onNewShippingMethodChange,
  onAdd,
  onRemove,
  onToggle,
}: {
  settings: Settings;
  newShippingMethod: ShippingMethod;
  onNewShippingMethodChange: (method: ShippingMethod) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onToggle: (index: number) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold border-b pb-2" style={{ color: COLORS.primary, borderColor: COLORS.surfaceLight }}>
        Shipping Methods
      </h2>

      <div className="space-y-4">
        {settings.shippingMethods.map((method, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border"
            style={{ borderColor: COLORS.surfaceLight, backgroundColor: COLORS.surface }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium" style={{ color: COLORS.text }}>
                    {method.name}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      method.enabled ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {method.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                  {method.description}
                </p>
                <p className="text-sm font-medium mt-1" style={{ color: COLORS.primary }}>
                  Cost: {CURRENCY_SYMBOL[settings.currency] ?? settings.currency}
                  {method.cost.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggle(index)}
                  className="p-1.5 rounded-md"
                  style={{
                    backgroundColor: method.enabled ? `${COLORS.error}15` : `${COLORS.primary}15`,
                    color: method.enabled ? COLORS.error : COLORS.primary,
                  }}
                >
                  {method.enabled ? "Disable" : "Enable"}
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
            Add New Shipping Method
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
                Method Name
              </label>
              <input
                type="text"
                value={newShippingMethod.name}
                onChange={(e) => onNewShippingMethodChange({ ...newShippingMethod, name: e.target.value })}
                className="w-full px-3 py-2 rounded-md border focus:outline-none"
                style={inputStyle}
                placeholder="e.g. Standard Shipping"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
                Cost
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newShippingMethod.cost}
                onChange={(e) => onNewShippingMethodChange({ ...newShippingMethod, cost: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-md border focus:outline-none"
                style={inputStyle}
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
                Description
              </label>
              <input
                type="text"
                value={newShippingMethod.description}
                onChange={(e) =>
                  onNewShippingMethodChange({ ...newShippingMethod, description: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border focus:outline-none"
                style={inputStyle}
                placeholder="e.g. Delivery within 3-5 business days"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={onAdd} className="px-4 py-2 rounded-md text-white" style={{ backgroundColor: COLORS.primary }}>
              Add Shipping Method
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
