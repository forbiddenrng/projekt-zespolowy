import React from "react";
import { render, screen } from "@testing-library/react";
import JobRow from "./JobRow";
import { JobModel } from "./JobOfferModel";
import { getWorkModeLabel, mapEmploymentStatus } from "@/app/lib/jobFormatters";

jest.mock("next/link", () => {
  return ({ children, href, className }: any) => {
    return (
      <a href={href} className={className} data-testid="job-link">
        {children}
      </a>
    );
  };
});

jest.mock("../../lib/jobFormatters", () => ({
  getWorkModeLabel: jest.fn(),
  mapEmploymentStatus: jest.fn(),
}));

const mockGetWorkModeLabel = getWorkModeLabel as jest.Mock;
const mockMapEmploymentStatus = mapEmploymentStatus as jest.Mock;

describe("JobRows Component", () => {
  const baseJobMock = {
    id: "job-123",
    title: "Senior Frontend Developer",
    remote: false,
    hybrid: false,
    employment_statuses: ["B2B", "UoP"],
    company: {
      name: "Tech Solutions Inc.",
      country: "Poland",
      logo_url: "https://example.com/logo.png",
    },
    location: [
      {
        country_name: "Poland",
        display_name: "Warsaw",
      },
    ],
    salary: {
      min_annual_salary: 120000,
      max_annual_salary: 180000,
      salary_currency: "PLN",
    },
    external_id: 1,
    created_at: "2026-03-25T10:00:00Z",
    date_posted: "2026-03-25T10:00:00Z",
    updated_at: "2026-03-25T10:00:00Z",
    description: "Opis",
    technology_slugs: ["react"],
  } as JobModel;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWorkModeLabel.mockReturnValue("office");
    mockMapEmploymentStatus.mockImplementation((status) => status);
  });

  it("powinien poprawnie renderować tytuł oferty i nazwę firmy", () => {
    render(<JobRow job={baseJobMock} />);

    expect(screen.getByText("Senior Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText("Tech Solutions Inc.")).toBeInTheDocument();
  });

  it("powinien renderować inicjał firmy, jeśli logo nie jest podane", () => {
    const jobWithoutLogo = {
      ...baseJobMock,
      company: { ...baseJobMock.company, logo_url: null },
    };

    render(<JobRow job={jobWithoutLogo} />);
    expect(screen.getByText("T")).toBeInTheDocument();
    expect(
      screen.queryByAltText("Tech Solutions Inc."),
    ).not.toBeInTheDocument();
  });

  it("powinien poprawnie wyświetlać sformatowane widełki płacowe", () => {
    render(<JobRow job={baseJobMock} />);
    expect(screen.getByText("120k - 180k PLN")).toBeInTheDocument();
  });

  it("powinien wyświetlać 'Salary Undisclosed', gdy min_annual_alary jest puste", () => {
    const jobWithoutSalary = {
      ...baseJobMock,
      salary: {
        min_annual_salary: null,
        max_annual_salary: null,
        salary_currency: undefined,
      },
    };

    render(<JobRow job={jobWithoutSalary} />);
    expect(screen.getByText("Salary Undisclosed")).toBeInTheDocument();
  });

  it("powinien wyświetlać lokalizację biura tylko wtedy, gdy tryb pracy to 'office'", () => {
    mockGetWorkModeLabel.mockReturnValue("office");
    render(<JobRow job={baseJobMock} />);
    expect(screen.getByText(/office/i)).toBeInTheDocument();
    expect(screen.getByText(/\(Warsaw\)/i)).toBeInTheDocument();
  });

  it("nie powinien wyświetlać nazwy miasta, gdy tryb pracy jest inny niż 'office", () => {
    mockGetWorkModeLabel.mockReturnValue("remote");
    render(<JobRow job={baseJobMock} />);
    expect(screen.getByText(/remote/i)).toBeInTheDocument();
    expect(screen.queryByText(/\(Warsaw\)/i)).not.toBeInTheDocument();
  });

  it("powinien mapować i łączyć statusy zatrudnienia (employment_statuses)", () => {
    render(<JobRow job={baseJobMock} />);
    expect(mockMapEmploymentStatus).toHaveBeenCalledTimes(2);
    expect(mockMapEmploymentStatus).toHaveBeenCalledWith("B2B", 0, [
      "B2B",
      "UoP",
    ]);
    expect(mockMapEmploymentStatus).toHaveBeenCalledWith("UoP", 1, [
      "B2B",
      "UoP",
    ]);
    expect(screen.getByText(/B2b, UoP/i)).toBeInTheDocument();
  });

  it("powinien generować poprawny link do szczegółłów oferty", () => {
    render(<JobRow job={baseJobMock} />);
    const link = screen.getByTestId("job-link");
    expect(link).toHaveAttribute("href", "/jobs/job-123");
    expect(link).toHaveTextContent(/View Details/i);
  });
});
