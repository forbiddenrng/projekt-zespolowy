"use client";

import React from "react";
import { useJobs } from "../components/JobsContext";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FiChevronLeft,
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiCalendar,
  FiGlobe,
  FiClock,
  FiZap,
  FiAward,
  FiExternalLink,
  FiCheckCircle,
} from "react-icons/fi";
import { getWorkModeLabel, mapEmploymentStatus, mapSeniority } from "../../lib/jobFormatters";

export default function JobDetailsPage() {
  const { id } = useParams();
  const { getJobById } = useJobs();
  const job = getJobById(id as string);

  if (!job) {
    return (
      <main className="min-h-screen bg-background py-12 px-8 flex flex-col items-center justify-center text-center">
        <div className="bg-card_background p-10 rounded-[2.5rem] border border-card_border shadow-xl max-w-md">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <FiZap size={40} />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">
            Loading Error
          </h2>
          <p className="text-muted mb-8">
            Job offer data was not found in the cache. Please try refreshing the
            list.
          </p>
          <Link
            href="/jobs"
            className="inline-block w-full py-4 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition-all"
          >
            Back to Job List
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-muted hover:text-primary mb-8 transition-colors font-bold group"
        >
          <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Offers
        </Link>

        <div className="bg-card_background border border-card_border rounded-[2.5rem] shadow-2xl overflow-hidden mb-8">
          <div className="p-8 md:p-12 bg-gradient-to-br from-secondary/40 to-transparent">
            <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                {/* Logo */}
                <div className="w-28 h-28 bg-card_background rounded-3xl flex items-center justify-center border border-card_border shadow-lg overflow-hidden shrink-0">
                  {job.company.logo_url ? (
                    <img
                      src={job.company.logo_url}
                      alt={job.company.name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-4xl font-black text-primary">
                      {job.company.name[0]}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-black text-foreground leading-tight tracking-tight">
                    {job.title}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <span className="text-xl font-bold text-primary">
                      {job.company.name}
                    </span>
                    <span className="bg-green-500/10 text-green-500 px-4 py-1 rounded-full text-sm font-black border border-green-500/20 flex items-center gap-1">
                      <FiDollarSign />
                      {job.salary.min_annual_salary
                        ? `${job.salary.min_annual_salary / 1000}k - ${job.salary.max_annual_salary! / 1000}k ${job.salary.salary_currency}`
                        : "Salary Undisclosed"}
                    </span>
                  </div>
                </div>
              </div>

              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-black text-center shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                Apply via Source <FiExternalLink />
              </a>
            </div>
          </div>

          <div className="p-8 md:p-12 border-t border-card_border grid grid-cols-2 md:grid-cols-4 gap-6 bg-secondary/10">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-black text-muted tracking-widest flex items-center gap-1">
                <FiMapPin className="text-primary" /> Location
              </p>
              <p className="text-foreground font-bold">
                {job.location[0]?.display_name || "Remote / International"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-black text-muted tracking-widest flex items-center gap-1">
                <FiBriefcase className="text-primary" /> Seniority
              </p>
              <p className="text-foreground font-bold capitalize">
                {mapSeniority(job.seniority)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-black text-muted tracking-widest flex items-center gap-1">
                <FiClock className="text-primary" /> Work Mode
              </p>
              <p className="text-foreground font-bold capitalize">
                {getWorkModeLabel(job.remote, job.hybrid)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-black text-muted tracking-widest flex items-center gap-1">
                <FiCalendar className="text-primary" /> Posted At
              </p>
              <p className="text-foreground font-bold">
                {new Date(job.date_posted).toLocaleDateString("en-US")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card_background border border-card_border rounded-[2.5rem] p-8 md:p-10 shadow-sm">
              <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                Job Description
              </h2>
              <div className="prose prose-invert max-w-none text-foreground/80 leading-relaxed text-lg whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            <div className="bg-card_background border border-card_border rounded-[2.5rem] p-8 shadow-sm">
              <h2 className="text-xl font-black text-foreground mb-6">
                Technologies & Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.technology_slugs.map((slug) => (
                  <span
                    key={slug}
                    className="bg-secondary text-primary px-4 py-2 rounded-xl font-bold text-sm border border-border"
                  >
                    #{slug}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card_background border border-card_border rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="font-black text-foreground mb-6 text-lg">
                Employment Details
              </h3>
              <div className="space-y-4">
                {job.employment_statuses.map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-3 p-3 bg-secondary/50 rounded-2xl border border-border"
                  >
                    <FiCheckCircle className="text-green-500 shrink-0" />
                    <span className="text-foreground font-medium capitalize">
                      {mapEmploymentStatus(status)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-card_border">
                <h4 className="font-bold text-foreground mb-4">
                  Company Information
                </h4>
                <div className="flex items-center gap-3 mb-4">
                  <FiGlobe className="text-muted" />
                  <span className="text-sm text-muted">
                    Country: {job.company.country || "Not specified"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <FiAward className="text-muted" />
                  <span className="text-sm text-muted">
                    Last Updated:{" "}
                    {new Date(job.updated_at).toLocaleDateString("en-US")}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-lg shadow-primary/30 relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-xl font-black mb-2">Ready to Apply?</h4>
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                  Use our AI generator to create a perfect Resume and Cover
                  Letter tailored specifically to these requirements.
                </p>
                <Link
                  href="/generate"
                  className="block w-full py-3 bg-white text-primary rounded-xl font-black text-center text-sm hover:bg-opacity-90 transition-all"
                >
                  Generate Documents
                </Link>
              </div>
              <FiZap className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 rotate-12 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
