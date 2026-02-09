"use client";

import { useState, useEffect } from "react";
import { useJobs } from "./JobsContext";
import JobRow from "./JobRow";
import Pagination from "./Pagination";
import { FiInbox } from "react-icons/fi";

const ITEMS_PER_PAGE = 10;

export default function JobListWithPagination() {
  const { filteredJobs, searchQuery, sortBy, clearFilters } = useJobs();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);

  if (filteredJobs.length === 0) {
    return (
      <div className="bg-card_background rounded-[2.5rem] p-20 text-center border border-dashed border-card_border mt-8">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-muted">
          <FiInbox size={48} />
        </div>
        <h3 className="text-2xl font-black text-foreground">
          No results found
        </h3>
        <p className="text-muted mt-2 max-w-xs mx-auto text-lg">
          We couldn't find any offers matching your criteria. Try changing the
          filters.
        </p>
        <button
          onClick={clearFilters}
          className="mt-8 px-8 py-3 bg-secondary hover:bg-border text-foreground font-bold rounded-xl transition-all"
        >
          Clear all filters
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {currentItems.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </div>

      <div className="pt-10 pb-20">
        <Pagination
          currentPage={currentPage}
          totalItems={filteredJobs.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />

        <p className="text-center text-sm text-muted mt-6 font-medium">
          Showing{" "}
          <span className="text-foreground">{indexOfFirstItem + 1}</span> -{" "}
          <span className="text-foreground">
            {Math.min(indexOfLastItem, filteredJobs.length)}
          </span>{" "}
          of <span className="text-foreground">{filteredJobs.length}</span>{" "}
          available offers
        </p>
      </div>
    </div>
  );
}
