import { COLORS } from "../colors";

export function OrdersPagination({
  totalCount,
  startIndex,
  endIndex,
  itemsPerPage,
  onItemsPerPageChange,
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange,
}: {
  totalCount: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  currentPage: number;
  totalPages: number;
  pageNumbers: (number | "...")[];
  onPageChange: (page: number) => void;
}) {
  if (totalCount === 0) return null;

  return (
    <div
      className="px-4 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
      style={{ borderColor: `${COLORS.surfaceLight}60`, backgroundColor: COLORS.surface }}
    >
      <div className="flex items-center gap-4">
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          Showing{" "}
          <span className="font-semibold" style={{ color: COLORS.text }}>
            {startIndex + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold" style={{ color: COLORS.text }}>
            {Math.min(endIndex, totalCount)}
          </span>{" "}
          of <span className="font-semibold" style={{ color: COLORS.text }}>{totalCount}</span> orders
        </p>

        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: COLORS.textMuted }}>
            Per page:
          </label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 rounded border text-xs"
            style={{ backgroundColor: COLORS.inputBg, borderColor: COLORS.inputBorder, color: COLORS.text }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
          style={{
            backgroundColor: currentPage === 1 ? COLORS.surfaceLight : COLORS.primary,
            color: currentPage === 1 ? COLORS.textMuted : "white",
          }}
        >
          Previous
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) =>
            page === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs" style={{ color: COLORS.textMuted }}>
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className="min-w-[32px] h-8 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-110"
                style={{
                  backgroundColor: page === currentPage ? COLORS.primary : COLORS.surface,
                  color: page === currentPage ? "white" : COLORS.text,
                  border: page === currentPage ? "none" : `1px solid ${COLORS.surfaceLight}`,
                }}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
          style={{
            backgroundColor: currentPage === totalPages ? COLORS.surfaceLight : COLORS.primary,
            color: currentPage === totalPages ? COLORS.textMuted : "white",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
