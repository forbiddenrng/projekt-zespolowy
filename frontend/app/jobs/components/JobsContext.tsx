"use client";

import React, { createContext, useContext, useState } from "react";
import { JobModel } from "./JobOfferModel";

interface JobsContextType {
  jobs: JobModel[];
  setJobs: (jobs: JobModel[]) => void;
  getJobById: (id: string) => JobModel | undefined;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<JobModel[]>([]);

  const getJobById = (id: string) => jobs.find((j) => j.id === id);

  return (
    <JobsContext.Provider value={{ jobs, setJobs, getJobById }}>
      {children}
    </JobsContext.Provider>
  );
}

export const useJobs = () => {
  const context = useContext(JobsContext);
  if (!context) throw new Error("useJobs must be used within JobsProvider");
  return context;
};
