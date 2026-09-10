import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { COLORS } from "../colors";

export function OrderFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
      <div className="relative">
        <MagnifyingGlassIcon
          className="w-5 h-5 absolute top-2.5 left-3"
          style={{ color: COLORS.textMuted }}
        />
        <input
          type="text"
          placeholder="Search by Order No. (MAK-...), ID, customer, or product"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4 py-2.5 w-full rounded-lg text-sm transition-all duration-300 focus:ring-2"
          style={{
            backgroundColor: COLORS.inputBg,
            borderColor: COLORS.inputBorder,
            border: `1px solid ${COLORS.inputBorder}`,
            color: COLORS.text,
            outline: "none",
          }}
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute top-2.5 right-3 hover:scale-110 transition-transform"
          >
            <XMarkIcon className="w-5 h-5" style={{ color: COLORS.textMuted }} />
          </button>
        )}
      </div>

      <div className="relative">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="pl-4 pr-10 py-2.5 w-full appearance-none rounded-lg text-sm transition-all duration-300 focus:ring-2"
          style={{
            backgroundColor: COLORS.inputBg,
            borderColor: COLORS.inputBorder,
            border: `1px solid ${COLORS.inputBorder}`,
            color: COLORS.text,
            outline: "none",
          }}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <ChevronDownIcon
          className="w-4 h-4 absolute top-3 right-3 pointer-events-none"
          style={{ color: COLORS.textMuted }}
        />
      </div>

      <button
        onClick={onRefresh}
        className="group flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
        style={{ background: COLORS.primary }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.primaryDark;
          e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.primary}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.primary;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <ArrowPathIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
        <span>Refresh Orders</span>
      </button>
    </div>
  );
}
