"use client";

import { useState } from "react";
import { useJobs } from "./JobsContext";
import { FiSearch, FiFilter, FiCheck, FiTrash2 } from "react-icons/fi";

export default function JobFilters() {
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filteredJobs,
    selectedSeniority,
    setSelectedSeniority,
    selectedWorkMode,
    setSelectedWorkMode,
    clearFilters,
  } = useJobs();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="space-y-4 mb-8">
      <div className="bg-card_background border border-card_border rounded-[2.5rem] p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative group">
            <FiSearch
              className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Stanowisko, firma, technologia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-secondary rounded-3xl border border-transparent focus:border-primary/50 focus:bg-card_background transition-all outline-none text-foreground font-semibold"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-secondary border border-transparent hover:border-card_border px-6 py-4 pr-12 rounded-3xl text-foreground font-bold cursor-pointer outline-none transition-all"
            >
              <option value="newest">Najnowsze</option>
              <option value="salary_desc">Płaca (Najwyższa)</option>
              <option value="salary_asc">Płaca (Najniższa)</option>
            </select>

            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`p-4 rounded-3xl border transition-all flex items-center gap-2 font-bold ${
                isAdvancedOpen || selectedSeniority || selectedWorkMode
                  ? "bg-primary text-white border-primary"
                  : "bg-secondary text-foreground border-transparent hover:border-card_border"
              }`}
            >
              <FiFilter />
              <span className="hidden md:inline">Filtry</span>
              {(selectedSeniority || selectedWorkMode) && (
                <div className="w-2 h-2 bg-white rounded-full ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* PANEL ZAAWANSOWANY */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isAdvancedOpen
              ? "max-h-[500px] opacity-100 mt-6 pb-4"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6 border-t border-card_border">
            {/* Seniority */}
            <div>
              <p className="text-[10px] font-black uppercase text-muted mb-4 tracking-[0.2em]">
                Poziom doświadczenia
              </p>
              <div className="flex flex-wrap gap-2">
                {["Junior", "Mid", "Senior", "Lead"].map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setSelectedSeniority(
                        selectedSeniority === level ? null : level,
                      )
                    }
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      selectedSeniority === level
                        ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                        : "bg-secondary text-foreground border-transparent hover:border-card_border"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Tryb Pracy */}
            <div>
              <p className="text-[10px] font-black uppercase text-muted mb-4 tracking-[0.2em]">
                Tryb pracy
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "remote", label: "Zdalna" },
                  { id: "hybrid", label: "Hybrydowa" },
                  { id: "office", label: "Biuro" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() =>
                      setSelectedWorkMode(
                        selectedWorkMode === mode.id ? null : mode.id,
                      )
                    }
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${
                      selectedWorkMode === mode.id
                        ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                        : "bg-secondary text-foreground border-transparent hover:border-card_border"
                    }`}
                  >
                    {selectedWorkMode === mode.id && <FiCheck />}
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8 pt-4 border-t border-card_border/50 gap-4">
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm font-bold text-muted hover:text-error transition-colors px-4"
            >
              <FiTrash2 /> Wyczyść filtry
            </button>
            <button
              onClick={() => setIsAdvancedOpen(false)}
              className="px-8 py-3 bg-foreground text-background rounded-2xl font-black text-sm hover:opacity-90 transition-all"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 flex items-center justify-between">
        <p className="text-sm text-muted">
          Znaleziono{" "}
          <span className="text-foreground font-black">
            {filteredJobs.length}
          </span>{" "}
          ofert
        </p>
      </div>
    </div>
  );
}
