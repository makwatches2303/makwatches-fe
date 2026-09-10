import { COLORS } from "../../colors";
import type { Settings } from "../types";

const inputStyle = {
  backgroundColor: COLORS.inputBg,
  borderColor: COLORS.inputBorder,
  color: COLORS.text,
};

export function StoreInfoTab({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold border-b pb-2" style={{ color: COLORS.primary, borderColor: COLORS.surfaceLight }}>
        Store Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
            Store Name
          </label>
          <input
            type="text"
            value={settings.storeName}
            onChange={(e) => onChange({ ...settings, storeName: e.target.value })}
            className="w-full px-3 py-2 rounded-md border focus:outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
            Contact Email
          </label>
          <input
            type="email"
            value={settings.contactEmail}
            onChange={(e) => onChange({ ...settings, contactEmail: e.target.value })}
            className="w-full px-3 py-2 rounded-md border focus:outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
            Contact Phone
          </label>
          <input
            type="text"
            value={settings.contactPhone}
            onChange={(e) => onChange({ ...settings, contactPhone: e.target.value })}
            className="w-full px-3 py-2 rounded-md border focus:outline-none"
            style={inputStyle}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
            Store Description
          </label>
          <textarea
            value={settings.storeDescription}
            onChange={(e) => onChange({ ...settings, storeDescription: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-md border focus:outline-none"
            style={inputStyle}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
            Store Address
          </label>
          <textarea
            value={settings.address}
            onChange={(e) => onChange({ ...settings, address: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-md border focus:outline-none"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}
