"use client";

import { useEffect } from "react";
import { useJobs } from "../components/JobsContext";
import { JobModel } from "./JobOfferModel";

export default function JobsClientInitializer({ jobs }: { jobs: JobModel[] }) {
  const { setJobs } = useJobs();

  useEffect(() => {
    setJobs(jobs);
  }, [jobs, setJobs]);

  return null;
}
