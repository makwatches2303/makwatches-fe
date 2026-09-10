import { COLORS } from "../../colors";

export function SecurityTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold border-b pb-2" style={{ color: COLORS.primary, borderColor: COLORS.surfaceLight }}>
        Security Settings
      </h2>

      <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3">
          <div className="text-amber-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-amber-800">Security Settings</h3>
            <p className="text-sm text-amber-700 mt-1">
              Security-related settings such as password policies, login restrictions, and
              two-factor authentication can be configured here. Additional security features like
              API key management and webhook settings will be available in future updates.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm" style={{ color: COLORS.textMuted }}>
        Advanced security settings will be available in future updates.
      </div>
    </div>
  );
}
