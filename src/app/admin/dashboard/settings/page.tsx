"use client";

import { COLORS } from "../colors";
import { useSettings } from "./useSettings";
import { SettingsTabNav } from "./SettingsTabNav";
import { GeneralTab } from "./tabs/GeneralTab";
import { StoreInfoTab } from "./tabs/StoreInfoTab";
import { FinancialTab } from "./tabs/FinancialTab";
import { ShippingTab } from "./tabs/ShippingTab";
import { PaymentTab } from "./tabs/PaymentTab";
import { LegalTab } from "./tabs/LegalTab";
import { SocialMediaTab } from "./tabs/SocialMediaTab";
import { SecurityTab } from "./tabs/SecurityTab";

export default function SettingsPage() {
  const s = useSettings();

  if (s.loading) {
    return (
      <div className="w-full h-full flex items-center justify-center py-12">
        <div
          className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2"
          style={{ borderColor: COLORS.primary }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-18">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
          System Settings
        </h1>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          Configure your store settings and preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <SettingsTabNav activeTab={s.activeTab} onChange={s.setActiveTab} />

        <div className="flex-1 min-w-0">
          <div className="p-6 rounded-lg shadow-sm" style={{ backgroundColor: COLORS.background }}>
            {s.activeTab === "general" && (
              <GeneralTab settings={s.settings} onChange={s.setSettings} onLogoUpload={s.handleLogoUpload} />
            )}
            {s.activeTab === "store" && <StoreInfoTab settings={s.settings} onChange={s.setSettings} />}
            {s.activeTab === "financial" && <FinancialTab settings={s.settings} onChange={s.setSettings} />}
            {s.activeTab === "shipping" && (
              <ShippingTab
                settings={s.settings}
                newShippingMethod={s.newShippingMethod}
                onNewShippingMethodChange={s.setNewShippingMethod}
                onAdd={s.addShippingMethod}
                onRemove={s.removeShippingMethod}
                onToggle={s.toggleShippingMethod}
              />
            )}
            {s.activeTab === "payment" && (
              <PaymentTab
                settings={s.settings}
                newPaymentGateway={s.newPaymentGateway}
                onNewPaymentGatewayChange={s.setNewPaymentGateway}
                onAdd={s.addPaymentGateway}
                onRemove={s.removePaymentGateway}
                onToggle={s.togglePaymentGateway}
              />
            )}
            {s.activeTab === "legal" && <LegalTab settings={s.settings} onChange={s.setSettings} />}
            {s.activeTab === "social" && <SocialMediaTab settings={s.settings} onChange={s.setSettings} />}
            {s.activeTab === "security" && <SecurityTab />}

            <div className="mt-8 flex justify-end">
              <button
                onClick={s.saveSettings}
                disabled={s.saving}
                className="px-6 py-2 rounded-md text-white font-medium"
                style={{
                  backgroundColor: s.saving ? `${COLORS.primary}80` : COLORS.primary,
                  cursor: s.saving ? "not-allowed" : "pointer",
                }}
              >
                {s.saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
