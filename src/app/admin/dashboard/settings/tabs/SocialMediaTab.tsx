import { COLORS } from "../../colors";
import type { Settings, SocialMedia } from "../types";

const inputStyle = {
  backgroundColor: COLORS.inputBg,
  borderColor: COLORS.inputBorder,
  color: COLORS.text,
};

const FIELDS: { key: keyof SocialMedia; label: string; placeholder: string }[] = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/your-page" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/your-handle" },
  { key: "twitter", label: "Twitter / X", placeholder: "https://twitter.com/your-handle" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/your-company" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/c/your-channel" },
];

export function SocialMediaTab({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold border-b pb-2" style={{ color: COLORS.primary, borderColor: COLORS.surfaceLight }}>
        Social Media
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
              {field.label}
            </label>
            <input
              type="url"
              value={settings.socialMedia[field.key]}
              onChange={(e) =>
                onChange({
                  ...settings,
                  socialMedia: { ...settings.socialMedia, [field.key]: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded-md border focus:outline-none"
              style={inputStyle}
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
