"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { JobModel } from "../components/JobOfferModel";

interface JobsContextType {
  jobs: JobModel[];
  setJobs: (jobs: JobModel[]) => void;
  filteredJobs: JobModel[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  selectedSeniority: string | null;
  setSelectedSeniority: (s: string | null) => void;
  selectedWorkMode: string | null;
  setSelectedWorkMode: (m: string | null) => void;
  clearFilters: () => void;
  getJobById: (id: string) => JobModel | undefined;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<JobModel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedSeniority, setSelectedSeniority] = useState<string | null>(
    null,
  );
  const [selectedWorkMode, setSelectedWorkMode] = useState<string | null>(null);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSeniority(null);
    setSelectedWorkMode(null);
    setSortBy("newest");
  };

  const getJobById = (id: string) => jobs.find((j) => j.id === id);

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.company?.name?.toLowerCase().includes(q) ||
          j.technology_slugs?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (selectedSeniority) {
      result = result.filter(
        (j) => j.seniority?.toLowerCase() === selectedSeniority.toLowerCase(),
      );
    }

    if (selectedWorkMode) {
      if (selectedWorkMode === "remote")
        result = result.filter((j) => j.remote);
      if (selectedWorkMode === "hybrid")
        result = result.filter((j) => j.hybrid);
      if (selectedWorkMode === "office")
        result = result.filter((j) => !j.remote && !j.hybrid);
    }

    result.sort((a, b) => {
      if (sortBy === "newest")
        return (
          new Date(b.date_posted).getTime() - new Date(a.date_posted).getTime()
        );
      if (sortBy === "salary_desc")
        return (
          (b.salary?.max_annual_salary || 0) -
          (a.salary?.max_annual_salary || 0)
        );
      if (sortBy === "salary_asc")
        return (
          (a.salary?.min_annual_salary || 0) -
          (b.salary?.min_annual_salary || 0)
        );
      return 0;
    });

    return result;
  }, [jobs, searchQuery, sortBy, selectedSeniority, selectedWorkMode]);

  return (
    <JobsContext.Provider
      value={{
        jobs,
        setJobs,
        filteredJobs,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        selectedSeniority,
        setSelectedSeniority,
        selectedWorkMode,
        setSelectedWorkMode,
        clearFilters,
        getJobById,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
}

export const useJobs = () => {
  const context = useContext(JobsContext);
  if (!context) throw new Error("useJobs must be used within JobsProvider");
  return context;
};
