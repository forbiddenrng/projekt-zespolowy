import Link from "next/link";
import { JobModel } from "./JobOfferModel";

interface JobRowProps {
  job: JobModel;
}

export default function JobRow({ job }: JobRowProps) {
  const { title, company, salary, location, remote, employment_statuses } = job;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="flex flex-col md:flex-row md:items-center justify-between p-5 mb-4 bg-card_background border border-card_border hover:border-primary transition-all rounded-xl shadow-sm hover:shadow-md group"
    >
      <div className="flex items-center gap-5">
        {/* Logo firmy w stylu Twojego kreatora */}
        <div className="w-14 h-14 bg-secondary rounded-lg flex items-center justify-center text-primary font-bold overflow-hidden border border-border group-hover:border-primary/50 transition-colors">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl">{company.name.charAt(0)}</span>
          )}
        </div>

        <div>
          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-sm mt-1">
            <span className="font-semibold text-primary">{company.name}</span>
            <span className="text-muted">•</span>
            <span className="text-foreground/80 flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {remote ? "Zdalnie" : location[0]?.display_name}
            </span>
          </div>

          <div className="flex gap-2 mt-2">
            {employment_statuses.map((status) => (
              <span
                key={status}
                className="text-[10px] uppercase tracking-wider bg-border px-2 py-0.5 rounded text-muted font-bold"
              >
                {status}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 md:mt-0 flex flex-col md:items-end">
        <div className="text-green-500 font-extrabold text-lg">
          {salary.min_annual_salary && salary.max_annual_salary
            ? `${(salary.min_annual_salary / 1000).toFixed(0)}k - ${(salary.max_annual_salary / 1000).toFixed(0)}k ${salary.salary_currency}`
            : "Wynagrodzenie ukryte"}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted mt-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Dodano {new Date(job.date_posted).toLocaleDateString("pl-PL")}
        </div>
      </div>
    </Link>
  );
}
