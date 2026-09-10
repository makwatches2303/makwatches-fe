import {
  WrenchScrewdriverIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  TruckIcon,
  CreditCardIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { COLORS } from "../colors";
import type { TabId } from "./types";

const TAB_DEFS: { id: TabId; name: string; icon: typeof WrenchScrewdriverIcon }[] = [
  { id: "general", name: "General", icon: WrenchScrewdriverIcon },
  { id: "store", name: "Store Info", icon: GlobeAltIcon },
  { id: "financial", name: "Financial", icon: CurrencyDollarIcon },
  { id: "shipping", name: "Shipping", icon: TruckIcon },
  { id: "payment", name: "Payment", icon: CreditCardIcon },
  { id: "legal", name: "Legal", icon: DocumentTextIcon },
  { id: "social", name: "Social Media", icon: UserGroupIcon },
  { id: "security", name: "Security", icon: ShieldCheckIcon },
];

export function SettingsTabNav({
  activeTab,
  onChange,
}: {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <div className="md:w-60 shrink-0">
      <div className="sticky top-24 p-4 rounded-lg shadow-sm" style={{ backgroundColor: COLORS.background }}>
        <nav className="flex flex-col space-y-1">
          {TAB_DEFS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id ? "shadow-sm" : ""
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? `${COLORS.primary}15` : "transparent",
                color: activeTab === tab.id ? COLORS.primary : COLORS.text,
              }}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
