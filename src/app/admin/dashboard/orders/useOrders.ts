import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/design-system";
import { getErrorMessage } from "@/lib/errors";
import type { Order, TrackingData } from "./types";

/** Page numbers for the pagination bar, with "..." gaps for long ranges. */
function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  if (currentPage <= 3) {
    for (let i = 1; i <= 4; i++) pages.push(i);
    pages.push("...");
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1);
    pages.push("...");
    for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("...");
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
    pages.push("...");
    pages.push(totalPages);
  }

  return pages;
}

/**
 * All state and data operations for the admin orders page: fetching orders
 * and per-order tracking, updating status, search/filter, and pagination.
 * Kept separate from the page's JSX so each can be read (and changed) without
 * the other.
 */
export function useOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [updateOrder, setUpdateOrder] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("processing");
  const [newPaymentStatus, setNewPaymentStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [trackingData, setTrackingData] = useState<Record<string, TrackingData>>({});
  const [trackingLoading, setTrackingLoading] = useState<Record<string, boolean>>({});

  const fetchTrackingData = async (orderId: string) => {
    if (trackingData[orderId] || trackingLoading[orderId]) return;

    setTrackingLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      // `/shipping/track/:waybill` is the public track-by-tracking-number
      // route; passing an order id to it never matched, so admin tracking was
      // silently broken. The per-order route is the one that takes an order id,
      // and it is the same service call the customer view uses.
      const res = await api.get(`/shipping/track/order/${orderId}`);
      if (res.data.success) {
        setTrackingData((prev) => ({ ...prev, [orderId]: res.data.data }));
      }
    } catch (error) {
      console.error("Failed to fetch tracking:", error);
    } finally {
      setTrackingLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Admin can fetch all orders (requires backend route /orders for admin)
      const res = await api.get("/orders");

      const normalized = res.data.data.map((order: Order & { _id?: string }) => ({
        ...order,
        id: order.id || order._id || "",
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: order.updatedAt || new Date().toISOString(),
      }));

      setOrders(normalized);
    } catch (error) {
      console.error("Error fetching orders", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateOrder || !newStatus) return;

    try {
      const payload: Record<string, string> = { status: newStatus };
      if (newPaymentStatus) payload.paymentStatus = newPaymentStatus;
      await api.patch(`/orders/${updateOrder}/status`, payload);

      setOrders(
        orders.map((order) =>
          order.id === updateOrder
            ? {
                ...order,
                status: newStatus,
                paymentStatus: newPaymentStatus || order.paymentStatus,
                updatedAt: new Date().toISOString(),
              }
            : order
        )
      );

      setUpdateOrder(null);
      setNewPaymentStatus("");
      toast("Order status updated successfully", { tone: "success" });
    } catch (error) {
      console.error("Error updating order status", error);
      toast(getErrorMessage(error, "Failed to update order status."), {
        tone: "error",
      });
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = orders.filter((order) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (order.orderNumber && order.orderNumber.toLowerCase().includes(searchLower)) ||
      order.id.toLowerCase().includes(searchLower) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
      order.userId.toLowerCase().includes(searchLower) ||
      order.items.some((item) => item.productName.toLowerCase().includes(searchLower));

    const matchesStatus = !statusFilter || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return {
    // data
    orders,
    loading,
    filteredOrders,
    paginatedOrders,
    fetchOrders,

    // view/update panels
    viewOrder,
    setViewOrder,
    updateOrder,
    setUpdateOrder,
    newStatus,
    setNewStatus,
    newPaymentStatus,
    setNewPaymentStatus,
    handleUpdateStatus,

    // search/filter
    search,
    setSearch,
    statusFilter,
    setStatusFilter,

    // pagination
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    pageNumbers: getPageNumbers(currentPage, totalPages),

    // tracking
    trackingData,
    trackingLoading,
    fetchTrackingData,
  };
}
