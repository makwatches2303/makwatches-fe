import Image from "next/image";
import { COLORS } from "../../colors";
import { ToggleSwitch } from "../ToggleSwitch";
import type { Settings } from "../types";

export function GeneralTab({
  settings,
  onChange,
  onLogoUpload,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold border-b pb-2" style={{ color: COLORS.primary, borderColor: COLORS.surfaceLight }}>
        General Settings
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
            Store Logo
          </label>
          <div className="flex items-end gap-4">
            {settings.logo ? (
              <div className="relative w-32 h-32 border rounded-lg overflow-hidden" style={{ borderColor: COLORS.surfaceLight }}>
                <Image
                  src={
                    settings.logo.startsWith("http")
                      ? settings.logo
                      : `${process.env.NEXT_PUBLIC_API_BASE_URL}${settings.logo}`
                  }
                  alt="Store Logo"
                  fill
                  sizes="128px"
                  className="object-cover"
                />
                <button
                  onClick={() => onChange({ ...settings, logo: "" })}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center z-10"
                  style={{ backgroundColor: `${COLORS.error}90` }}
                >
                  <span className="text-white text-xs">✕</span>
                </button>
              </div>
            ) : (
              <div
                className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center"
                style={{ borderColor: COLORS.surfaceLight }}
              >
                <span className="text-sm text-center" style={{ color: COLORS.textMuted }}>
                  No logo uploaded
                </span>
              </div>
            )}
            <div>
              <input type="file" id="logo" accept="image/*" className="hidden" onChange={onLogoUpload} />
              <label
                htmlFor="logo"
                className="inline-block px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
                style={{ backgroundColor: `${COLORS.primary}15`, color: COLORS.primary }}
              >
                Upload Logo
              </label>
              <p className="mt-1 text-xs" style={{ color: COLORS.textMuted }}>
                Recommended: 200x200px, PNG or JPG
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
                Maintenance Mode
              </label>
              <ToggleSwitch
                checked={settings.maintenanceMode}
                onChange={() => onChange({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              />
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                When enabled, the store will show a maintenance page to visitors
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
                Allow User Registration
              </label>
              <ToggleSwitch
                checked={settings.enableRegistration}
                onChange={() => onChange({ ...settings, enableRegistration: !settings.enableRegistration })}
              />
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                When disabled, new users cannot register on the store
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
