import { COLORS } from "../../colors";
import type { Settings } from "../types";

const inputStyle = {
  backgroundColor: COLORS.inputBg,
  borderColor: COLORS.inputBorder,
  color: COLORS.text,
};

export function LegalTab({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold border-b pb-2" style={{ color: COLORS.primary, borderColor: COLORS.surfaceLight }}>
        Legal Documents
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
            Terms of Service
          </label>
          <textarea
            value={settings.termsOfService}
            onChange={(e) => onChange({ ...settings, termsOfService: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 rounded-md border focus:outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
            Privacy Policy
          </label>
          <textarea
            value={settings.privacyPolicy}
            onChange={(e) => onChange({ ...settings, privacyPolicy: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 rounded-md border focus:outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
            Refund Policy
          </label>
          <textarea
            value={settings.refundPolicy}
            onChange={(e) => onChange({ ...settings, refundPolicy: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 rounded-md border focus:outline-none"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}
