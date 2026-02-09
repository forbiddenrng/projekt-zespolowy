import Link from "next/link";
import { JobModel } from "./JobOfferModel";
import { FiArrowRight, FiMapPin, FiClock } from "react-icons/fi";

interface JobRowProps {
  job: JobModel;
}

export default function JobRow({ job }: JobRowProps) {
  const { id, title, company, salary, location, remote, employment_statuses } =
    job;

  return (
    <div className="group relative bg-card_background border border-card_border hover:border-primary transition-all duration-300 rounded-2xl shadow-sm hover:shadow-xl overflow-hidden">
      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-secondary rounded-xl flex items-center justify-center text-primary font-bold overflow-hidden border border-border group-hover:border-primary/30 transition-colors shrink-0">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl">{company.name.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors truncate">
              {title}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-sm mt-1.5 text-muted">
              <span className="font-bold text-primary/90">{company.name}</span>
              <span className="flex items-center gap-1">
                <FiMapPin className="text-primary/60" />
                {remote ? "Remote" : location[0]?.display_name}
              </span>
              <span className="flex items-center gap-1">
                <FiClock className="text-primary/60" />
                {employment_statuses.join(", ")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:items-end justify-center shrink-0 gap-4">
          <div className="text-right">
            <div className="text-green-500 font-black text-xl">
              {salary.min_annual_salary
                ? `${(salary.min_annual_salary / 1000).toFixed(0)}k - ${(salary.max_annual_salary! / 1000).toFixed(0)}k ${salary.salary_currency}`
                : "Salary Undisclosed"}
            </div>
            <p className="text-[10px] text-muted uppercase tracking-widest font-bold mt-1">
              Annual Salary (Gross)
            </p>
          </div>

          <Link
            href={`/jobs/${id}`}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-secondary hover:bg-primary text-foreground hover:text-white rounded-xl font-bold transition-all duration-200 border border-border hover:border-primary shadow-sm group/btn"
          >
            View Details
            <FiArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="h-1 w-0 group-hover:w-full bg-primary transition-all duration-500" />
    </div>
  );
}
