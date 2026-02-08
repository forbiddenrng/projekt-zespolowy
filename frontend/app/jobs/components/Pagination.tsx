"use client";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-12">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-4 py-2 bg-card_background border border-card_border rounded-xl text-foreground disabled:opacity-30 hover:border-primary transition-all font-bold"
      >
        Poprzednia
      </button>

      <div className="flex gap-2">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => onPageChange(i + 1)}
            className={`w-10 h-10 rounded-xl font-bold transition-all ${
              currentPage === i + 1
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-card_background border border-card_border text-muted hover:border-primary"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-4 py-2 bg-card_background border border-card_border rounded-xl text-foreground disabled:opacity-30 hover:border-primary transition-all font-bold"
      >
        Następna
      </button>
    </div>
  );
}
