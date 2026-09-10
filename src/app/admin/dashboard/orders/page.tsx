"use client";

import { COLORS } from "../colors";
import { useOrders } from "./useOrders";
import { OrderFilters } from "./OrderFilters";
import { OrderStatusForm } from "./OrderStatusForm";
import { OrderDetailPanel } from "./OrderDetailPanel";
import { OrdersTable } from "./OrdersTable";
import { OrdersPagination } from "./OrdersPagination";

export default function OrdersPage() {
  const o = useOrders();

  return (
    <div className="space-y-5 pt-18">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <div className="flex items-center mb-3 group">
          <div
            className="w-1 h-8 rounded-full mr-3 transform group-hover:scale-y-110 transition-transform duration-300"
            style={{ backgroundColor: COLORS.primary }}
          />
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 hover:tracking-wide transition-all duration-300"
              style={{ color: COLORS.primary }}
            >
              Order Management
            </h1>
            <p className="text-xs sm:text-sm" style={{ color: COLORS.textMuted }}>
              Track, view and update customer orders
            </p>
          </div>
        </div>
        <div
          className="w-24 h-1 rounded-full transform hover:w-32 transition-all duration-500"
          style={{ background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})` }}
        />
      </div>

      <OrderFilters
        search={o.search}
        onSearchChange={o.setSearch}
        statusFilter={o.statusFilter}
        onStatusFilterChange={o.setStatusFilter}
        onRefresh={o.fetchOrders}
      />

      {o.updateOrder && (
        <OrderStatusForm
          orders={o.orders}
          updateOrderId={o.updateOrder}
          newStatus={o.newStatus}
          onNewStatusChange={o.setNewStatus}
          newPaymentStatus={o.newPaymentStatus}
          onNewPaymentStatusChange={o.setNewPaymentStatus}
          onCancel={() => o.setUpdateOrder(null)}
          onSubmit={o.handleUpdateStatus}
        />
      )}

      {o.viewOrder && (
        <OrderDetailPanel
          order={o.viewOrder}
          tracking={o.trackingData[o.viewOrder.id]}
          trackingLoading={!!o.trackingLoading[o.viewOrder.id]}
          onFetchTracking={() => o.fetchTrackingData(o.viewOrder!.id)}
          onClose={() => o.setViewOrder(null)}
          onUpdateStatus={() => {
            o.setUpdateOrder(o.viewOrder!.id);
            o.setNewStatus(o.viewOrder!.status);
            o.setViewOrder(null);
          }}
        />
      )}

      {o.loading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <div
            className="w-10 h-10 border-3 rounded-full animate-spin"
            style={{ borderColor: `${COLORS.secondary}40`, borderTopColor: COLORS.primary }}
          />
          <p className="text-sm animate-pulse" style={{ color: COLORS.textMuted }}>
            Loading orders...
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl shadow-md overflow-hidden border transition-all duration-300 hover:shadow-lg"
          style={{ backgroundColor: COLORS.background, borderColor: `${COLORS.surfaceLight}60` }}
        >
          <OrdersTable
            orders={o.paginatedOrders}
            search={o.search}
            onView={o.setViewOrder}
            onUpdate={(order) => {
              o.setUpdateOrder(order.id);
              o.setNewStatus(order.status);
            }}
          />
          <OrdersPagination
            totalCount={o.filteredOrders.length}
            startIndex={o.startIndex}
            endIndex={o.endIndex}
            itemsPerPage={o.itemsPerPage}
            onItemsPerPageChange={(value) => {
              o.setItemsPerPage(value);
              o.setCurrentPage(1);
            }}
            currentPage={o.currentPage}
            totalPages={o.totalPages}
            pageNumbers={o.pageNumbers}
            onPageChange={o.setCurrentPage}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
