"use client";

import { useState, useEffect } from "react";
import { useJobs } from "./JobsContext";
import JobRow from "./JobRow";
import Pagination from "./Pagination";
import { FiInbox } from "react-icons/fi";

const ITEMS_PER_PAGE = 10;

export default function JobListWithPagination() {
  const { filteredJobs, searchQuery, sortBy } = useJobs();
  const [currentPage, setCurrentPage] = useState(1);

  // Resetujemy stronę do pierwszej przy każdej zmianie filtrów lub wyszukiwania
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  // Obliczanie indeksów dla aktualnej strony
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);

  if (filteredJobs.length === 0) {
    return (
      <div className="bg-card_background rounded-[2.5rem] p-20 text-center border border-dashed border-card_border mt-8">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-muted">
          <FiInbox size={48} />
        </div>
        <h3 className="text-2xl font-black text-foreground">Brak wyników</h3>
        <p className="text-muted mt-2 max-w-xs mx-auto text-lg">
          Nie znaleźliśmy żadnych ofert pasujących do Twoich kryteriów. Spróbuj
          zmienić filtry.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-8 py-3 bg-secondary hover:bg-border text-foreground font-bold rounded-xl transition-all"
        >
          Wyczyść wszystko
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista Ofert z animacją wejścia */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {currentItems.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </div>

      {/* Paginacja */}
      <div className="pt-10 pb-20">
        <Pagination
          currentPage={currentPage}
          totalItems={filteredJobs.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => {
            setCurrentPage(page);
            // Przewijanie do góry po zmianie strony dla lepszego UX
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />

        <p className="text-center text-sm text-muted mt-6 font-medium">
          Wyświetlasz{" "}
          <span className="text-foreground">{indexOfFirstItem + 1}</span> -{" "}
          <span className="text-foreground">
            {Math.min(indexOfLastItem, filteredJobs.length)}
          </span>{" "}
          z <span className="text-foreground">{filteredJobs.length}</span>{" "}
          dostępnych ofert
        </p>
      </div>
    </div>
  );
}
