import { format } from "date-fns";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "MMM dd, yyyy h:mm a");
  } catch {
    return "Invalid date";
  }
}

type StatusColors = { bg: string; text: string; border: string };

export function getStatusColor(status: string): StatusColors {
  switch (status.toLowerCase()) {
    case "pending":
      return { bg: "#FEF3C7", text: "#B45309", border: "#F59E0B" };
    case "processing":
      return { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" };
    case "shipped":
      return { bg: "#E0E7FF", text: "#4338CA", border: "#6366F1" };
    case "delivered":
      return { bg: "#D1FAE5", text: "#065F46", border: "#10B981" };
    case "cancelled":
      return { bg: "#FEE2E2", text: "#B91C1C", border: "#EF4444" };
    default:
      return { bg: "#F3F4F6", text: "#374151", border: "#9CA3AF" };
  }
}

export function getPaymentStatusColor(status?: string): StatusColors {
  switch ((status || "").toLowerCase()) {
    case "paid":
      return { bg: "#ECFDF5", text: "#065F46", border: "#10B981" };
    case "unpaid":
      return { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" };
    case "failed":
      return { bg: "#FEE2E2", text: "#991B1B", border: "#EF4444" };
    case "refunded":
      return { bg: "#E0E7FF", text: "#3730A3", border: "#6366F1" };
    default:
      return { bg: "#F3F4F6", text: "#374151", border: "#9CA3AF" };
  }
}
