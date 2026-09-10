import { COLORS } from "../../colors";
import type { Settings } from "../types";

const inputStyle = {
  backgroundColor: COLORS.inputBg,
  borderColor: COLORS.inputBorder,
  color: COLORS.text,
};

export function FinancialTab({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold border-b pb-2" style={{ color: COLORS.primary, borderColor: COLORS.surfaceLight }}>
        Financial Settings
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
            Currency
          </label>
          <select
            value={settings.currency}
            onChange={(e) => onChange({ ...settings, currency: e.target.value })}
            className="w-full px-3 py-2 rounded-md border focus:outline-none"
            style={inputStyle}
          >
            <option value="INR">Indian Rupee (₹)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
            <option value="GBP">British Pound (£)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
            Tax Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={settings.taxRate}
            onChange={(e) => onChange({ ...settings, taxRate: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 rounded-md border focus:outline-none"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}
