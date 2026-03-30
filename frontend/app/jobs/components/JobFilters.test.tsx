import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import JobFilters from "./JobFilters";
import { useJobs } from "./JobsContext";

jest.mock("./JobsContext");
const mockUseJobs = useJobs as jest.MockedFunction<typeof useJobs>;

describe("JobFilters Component", () => {
  const mockSetSearchQuery = jest.fn();
  const mockSetSortBy = jest.fn();
  const mockSetSelectedSeniority = jest.fn();
  const mockSetSelectedWorkMode = jest.fn();
  const mockClearFilters = jest.fn();

  const defaultJobsContextValue = {
    searchQuery: "",
    setSearchQuery: mockSetSearchQuery,
    sortBy: "newest",
    setSortBy: mockSetSortBy,
    filteredJobs: [{ id: 1 }, { id: 2 }, { id: 3 }],
    selectedSeniority: null,
    setSelectedSeniority: mockSetSelectedSeniority,
    selectedWorkMode: null,
    setSelectedWorkMode: mockSetSelectedWorkMode,
    clearFilters: mockClearFilters,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseJobs.mockReturnValue(defaultJobsContextValue);
  });

  it("powinien poprawnie renderować pasek wyszukiwania, sortowania i liczbę ofert", () => {
    render(<JobFilters />);

    expect(
      screen.getByPlaceholderText(/Job title, company, technology.../i),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Newest" })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/offers/i)).toBeInTheDocument();
  });

  it("powinien wywołać setSearchQuery podczas wpisywania teksty w wyszukiwarkę", () => {
    render(<JobFilters />);

    const searchInput = screen.getByPlaceholderText(
      /Job title, company, technology.../i,
    );
    fireEvent.change(searchInput, { target: { value: "React Developer" } });

    expect(mockSetSearchQuery).toHaveBeenCalledWith("React Developer");
  });

  it("powinien wywołać setSortBy po zmienie opcji sortowania", () => {
    render(<JobFilters />);

    const sortSelect = screen.getByRole("combobox");
    fireEvent.change(sortSelect, { target: { value: "salary_desc" } });

    expect(mockSetSortBy).toHaveBeenCalledWith("salary_desc");
  });

  it("powinien otwierac i zamykać zaawansowane filtry po kliknięciu przycisku 'Filters'", () => {
    const { container } = render(<JobFilters />);
    const filterButton = screen.getByRole("button", { name: /^Filters$/i });

    const drawerWrapper = container.querySelector(
      ".overflow-hidden.transition-all",
    );
    expect(drawerWrapper).toHaveClass("max-h-0", "opacity-0");

    fireEvent.click(filterButton);
    expect(drawerWrapper).toHaveClass("max-h-[500px]", "opacity-100");

    const closeButton = screen.getByRole("button", { name: /Close/i });
    fireEvent.click(closeButton);
    expect(drawerWrapper).toHaveClass("max-h-0", "opacity-0");
  });

  it("powinien wywołać setSelectedSeniority z odpowiednim ID po klinięciu w poziom doświadczenia", () => {
    render(<JobFilters />);
    const seniorButton = screen.getByRole("button", { name: "Senior" });
    fireEvent.click(seniorButton);
    expect(mockSetSelectedSeniority).toHaveBeenCalledWith("senior");
  });

  it("powinien odznaczyć poziom doświadczenie (wysłać null), jeśli kliknięto w już zaznaczony", () => {
    mockUseJobs.mockReturnValue({
      ...defaultJobsContextValue,
      selectedSeniority: "junior",
    });

    render(<JobFilters />);
    const juniorButton = screen.getByRole("button", { name: "Junior" });
    fireEvent.click(juniorButton);
    expect(mockSetSelectedSeniority).toHaveBeenCalledWith(null);
  });

  it("powinien wywołać setSelectedWorkMode z odpowiednim ID po kliknięciu w tryb pracy", () => {
    render(<JobFilters />);
    const remoteButton = screen.getByRole("button", { name: "Remote" });
    fireEvent.click(remoteButton);
    expect(mockSetSelectedWorkMode).toHaveBeenCalledWith("remote");
  });

  it("powninien odznaczyć tryb pracy (wysłać null), jeśli kliknięto w już zaznaczony", () => {
    mockUseJobs.mockReturnValue({
      ...defaultJobsContextValue,
      selectedWorkMode: "hybrid",
    });

    render(<JobFilters />);
    const hybridButton = screen.getByRole("button", { name: "Hybrid" });
    fireEvent.click(hybridButton);
    expect(mockSetSelectedWorkMode).toHaveBeenCalledWith(null);
  });

  it("powinien wywołać clearFilters po kliknięciu w przycisk 'Clear filters'", () => {
    render(<JobFilters />);

    const clearFiltersButton = screen.getByRole("button", {
      name: /Clear filters/i,
    });
    fireEvent.click(clearFiltersButton);
    expect(mockClearFilters).toHaveBeenCalled();
  });

  it("powinien nakładać aktywne style na przycisk 'Filters', gdy jakikolwiek filtr zaawansowany jest wybrany", () => {
    mockUseJobs.mockReturnValue({
      ...defaultJobsContextValue,
      selectedWorkMode: "hybrid",
    });

    render(<JobFilters />);
    const filterButton = screen.getByRole("button", { name: /^Filters$/i });
    expect(filterButton).toHaveClass("bg-primary", "text-white");
  });
});
