import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import JobListWithPagination from "./JobListWithPagination";
import { useJobs } from "./JobsContext";

jest.mock("./JobsContext");
jest.mock("./JobRow", () => ({ job }: { job: any }) => (
  <div data-testid="job-row">{job.title}</div>
));
jest.mock(
  "./Pagination",
  () =>
    ({ currentPage, totalItems, onPageChange }: any) => (
      <div data-testid="pagination">
        <span data-testid="current-page">Page: {currentPage}</span>
        <span data-testid="total-items">Total: {totalItems}</span>
        <button
          data-testid="next-page-btn"
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next Page
        </button>
      </div>
    ),
);

const mockUseJobs = useJobs as jest.MockedFunction<typeof useJobs>;

describe("JobListWithPagination Component", () => {
  const mockClearFilters = jest.fn();

  const generateMockJobs = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: `Job Offer ${i + 1}`,
    }));

  const defaultContextValue = {
    filteredJobs: generateMockJobs(25),
    searchQuery: "",
    sortBy: "newest",
    clearFilters: mockClearFilters,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseJobs.mockReturnValue(defaultContextValue);
    window.scrollTo = jest.fn();
  });

  it("powinien renderować pusty stan (Empty State), gdy filtered Jobs jest pusty", () => {
    mockUseJobs.mockReturnValue({
      ...defaultContextValue,
      filteredJobs: [],
    });

    render(<JobListWithPagination />);
    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(
      screen.getByText(/We couldn't find any offers matching your criteria/i),
    ).toBeInTheDocument();

    const clearButton = screen.getByRole("button", {
      name: /Clear all filters/i,
    });
    fireEvent.click(clearButton);
    expect(mockClearFilters).toHaveBeenCalled();
  });

  it("powinien renderować tylko określoną liczbę elementów (ITEMS_PER_PAGE) na pierwszej stronie", () => {
    render(<JobListWithPagination />);
    const displayedJobs = screen.getAllByTestId("job-row");
    expect(displayedJobs).toHaveLength(10);
    expect(screen.getByText("Job Offer 1")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 2")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 3")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 4")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 5")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 6")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 7")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 8")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 9")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 10")).toBeInTheDocument();
    expect(screen.queryByText("Job Offer 11")).not.toBeInTheDocument();
  });

  it("powinien wyświetlać prawidłowy tekst informacyjny o zakresie pokazywanych ofert", () => {
    render(<JobListWithPagination />);

    const infoText = screen.getByText(/Showing/i);
    expect(within(infoText).getByText("1")).toBeInTheDocument();
    expect(within(infoText).getByText("10")).toBeInTheDocument();
    expect(within(infoText).getByText("25")).toBeInTheDocument();
  });

  it("powinien poprawnie zmieniać stronę i przewijać na górę po kliknięciu w paginacji", () => {
    render(<JobListWithPagination />);
    expect(screen.getByTestId("current-page")).toHaveTextContent("Page: 1");

    const nextPageBtn = screen.getByTestId("next-page-btn");
    fireEvent.click(nextPageBtn);
    expect(screen.getByTestId("current-page")).toHaveTextContent("Page: 2");

    expect(screen.queryByText("Job Offer 10")).not.toBeInTheDocument();
    expect(screen.getByText("Job Offer 11")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 12")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 13")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 14")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 15")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 16")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 17")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 18")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 19")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 20")).toBeInTheDocument();

    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  it("powinien resetować stronę do 1 po zmianie searchQuery lub sortBy", () => {
    const { rerender } = render(<JobListWithPagination />);

    const nextPageBtn = screen.getByTestId("next-page-btn");
    fireEvent.click(nextPageBtn);
    expect(screen.getByTestId("current-page")).toHaveTextContent("Page: 2");

    mockUseJobs.mockReturnValue({
      ...defaultContextValue,
      searchQuery: "React",
    });

    rerender(<JobListWithPagination />);
    expect(screen.getByTestId("current-page")).toHaveTextContent("Page: 1");
  });

  it("powinien poprawnie wyświetlać końcówke listy na ostatniej stronie", () => {
    mockUseJobs.mockReturnValue({
      ...defaultContextValue,
      filteredJobs: generateMockJobs(13),
    });

    render(<JobListWithPagination />);

    const nextPageBtn = screen.getByTestId("next-page-btn");
    fireEvent.click(nextPageBtn);

    const displayedJobs = screen.getAllByTestId("job-row");
    expect(displayedJobs).toHaveLength(3);

    expect(screen.getByText("Job Offer 11")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 12")).toBeInTheDocument();
    expect(screen.getByText("Job Offer 13")).toBeInTheDocument();

    const infoText = screen.getByText(/Showing/i);
    expect(within(infoText).getByText("11")).toBeInTheDocument();
    expect(within(infoText).getAllByText("13").length).toBeGreaterThanOrEqual(
      2,
    );
  });
});
