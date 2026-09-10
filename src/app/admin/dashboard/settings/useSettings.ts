import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import type { PaymentGateway, Settings, ShippingMethod, TabId } from "./types";

const DEFAULT_SETTINGS: Settings = {
  storeName: "Makwatches",
  storeDescription: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  logo: "",
  currency: "INR",
  taxRate: 18,
  shippingMethods: [],
  paymentGateways: [],
  socialMedia: {
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    youtube: "",
  },
  privacyPolicy: "",
  termsOfService: "",
  refundPolicy: "",
  enableRegistration: true,
  maintenanceMode: false,
};

const EMPTY_SHIPPING_METHOD: ShippingMethod = {
  name: "",
  description: "",
  cost: 0,
  enabled: true,
};

const EMPTY_PAYMENT_GATEWAY: PaymentGateway = {
  name: "",
  description: "",
  enabled: true,
};

/**
 * All state and data operations for the admin settings page: fetching and
 * saving settings, logo upload, and the shipping-method / payment-gateway
 * list editors. Kept separate from the page's JSX so each tab's markup can
 * be read without wading through this.
 */
export function useSettings() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [newShippingMethod, setNewShippingMethod] = useState<ShippingMethod>(EMPTY_SHIPPING_METHOD);
  const [newPaymentGateway, setNewPaymentGateway] = useState<PaymentGateway>(EMPTY_PAYMENT_GATEWAY);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get("admin/settings");
        if (response.data.success) {
          const incoming = (response.data.data || {}) as Partial<Settings>;
          // Normalize to avoid null/undefined arrays/objects causing runtime errors
          const normalized: Settings = {
            id: incoming.id,
            storeName: incoming.storeName ?? "",
            storeDescription: incoming.storeDescription ?? "",
            contactEmail: incoming.contactEmail ?? "",
            contactPhone: incoming.contactPhone ?? "",
            address: incoming.address ?? "",
            logo: incoming.logo ?? "",
            currency: incoming.currency ?? "INR",
            taxRate: typeof incoming.taxRate === "number" ? incoming.taxRate : 18,
            shippingMethods: Array.isArray(incoming.shippingMethods) ? incoming.shippingMethods : [],
            paymentGateways: Array.isArray(incoming.paymentGateways) ? incoming.paymentGateways : [],
            socialMedia: {
              facebook: incoming.socialMedia?.facebook ?? "",
              instagram: incoming.socialMedia?.instagram ?? "",
              twitter: incoming.socialMedia?.twitter ?? "",
              linkedin: incoming.socialMedia?.linkedin ?? "",
              youtube: incoming.socialMedia?.youtube ?? "",
            },
            privacyPolicy: incoming.privacyPolicy ?? "",
            termsOfService: incoming.termsOfService ?? "",
            refundPolicy: incoming.refundPolicy ?? "",
            enableRegistration:
              typeof incoming.enableRegistration === "boolean" ? incoming.enableRegistration : true,
            maintenanceMode:
              typeof incoming.maintenanceMode === "boolean" ? incoming.maintenanceMode : false,
          };
          setSettings(normalized);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await api.put("admin/settings", settings);
      if (response.data.success) {
        toast.success("Settings saved successfully");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await api.post("admin/settings/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setSettings((prev) => ({ ...prev, logo: response.data.data.logo }));
        toast.success("Logo uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    }
  };

  const addShippingMethod = () => {
    if (newShippingMethod.name && newShippingMethod.description) {
      setSettings((prev) => ({
        ...prev,
        shippingMethods: [...(prev.shippingMethods ?? []), newShippingMethod],
      }));
      setNewShippingMethod(EMPTY_SHIPPING_METHOD);
    } else {
      toast.error("Please fill in all shipping method fields");
    }
  };

  const removeShippingMethod = (index: number) => {
    setSettings((prev) => {
      const updated = [...(prev.shippingMethods ?? [])];
      updated.splice(index, 1);
      return { ...prev, shippingMethods: updated };
    });
  };

  const toggleShippingMethod = (index: number) => {
    setSettings((prev) => {
      const updated = [...(prev.shippingMethods ?? [])];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], enabled: !updated[index].enabled };
      return { ...prev, shippingMethods: updated };
    });
  };

  const addPaymentGateway = () => {
    if (newPaymentGateway.name && newPaymentGateway.description) {
      setSettings((prev) => ({
        ...prev,
        paymentGateways: [...(prev.paymentGateways ?? []), newPaymentGateway],
      }));
      setNewPaymentGateway(EMPTY_PAYMENT_GATEWAY);
    } else {
      toast.error("Please fill in all payment gateway fields");
    }
  };

  const removePaymentGateway = (index: number) => {
    setSettings((prev) => {
      const updated = [...(prev.paymentGateways ?? [])];
      updated.splice(index, 1);
      return { ...prev, paymentGateways: updated };
    });
  };

  const togglePaymentGateway = (index: number) => {
    setSettings((prev) => {
      const updated = [...(prev.paymentGateways ?? [])];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], enabled: !updated[index].enabled };
      return { ...prev, paymentGateways: updated };
    });
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    saving,
    settings,
    setSettings,
    saveSettings,
    handleLogoUpload,

    newShippingMethod,
    setNewShippingMethod,
    addShippingMethod,
    removeShippingMethod,
    toggleShippingMethod,

    newPaymentGateway,
    setNewPaymentGateway,
    addPaymentGateway,
    removePaymentGateway,
    togglePaymentGateway,
  };
}
