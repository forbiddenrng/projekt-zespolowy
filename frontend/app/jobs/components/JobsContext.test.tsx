import React from "react";
import { renderHook, act } from "@testing-library/react";
import { JobsProvider, useJobs } from "./JobsContext";
import { JobModel } from "./JobOfferModel";

const mockJobs: JobModel[] = [
  {
    id: "1",
    title: "Senior React Developer",
    company: { name: "Tech Giants" },
    technology_slugs: ["react", "typescript"],
    seniority: "senior",
    remote: true,
    hybrid: false,
    date_posted: "2026-03-25T10:00:00Z",
    salary: { min_annual_salary: 150000, max_annual_salary: 200000 },
  } as JobModel,
  {
    id: "2",
    title: "Mid Angular Developer",
    company: { name: "Corporate Inc" },
    technology_slugs: ["angular", "javascript"],
    seniority: "mid",
    remote: false,
    hybrid: true,
    date_posted: "2026-02-20T10:00:00Z",
    salary: { min_annual_salary: 90000, max_annual_salary: 140000 },
  } as JobModel,
  {
    id: "3",
    title: "Junior Vue Developer",
    company: { name: "Startup Hub" },
    technology_slugs: ["vue", "css"],
    seniority: "junior",
    remote: false,
    hybrid: false,
    date_posted: "2026-01-10T10:00:00Z",
    salary: { min_annual_salary: 50000, max_annual_salary: 80000 },
  } as JobModel,
];

describe("JobsContext", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <JobsProvider>{children}</JobsProvider>
  );

  it("powinien wyrzucić błąd, jeśli useJobs jest użyty poza JobsProvider", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => renderHook(() => useJobs())).toThrow(
      "useJobs must be used within JobsProvider",
    );
    consoleErrorSpy.mockRestore();
  });

  it("powinien dostarczyć domyślne wartości po inicjalizacji", () => {
    const { result } = renderHook(() => useJobs(), { wrapper });
    expect(result.current.jobs).toEqual([]);
    expect(result.current.filteredJobs).toEqual([]);
    expect(result.current.searchQuery).toBe("");
    expect(result.current.sortBy).toBe("newest");
    expect(result.current.selectedSeniority).toBeNull();
    expect(result.current.selectedWorkMode).toBeNull();
  });

  it("powinien ustawić listę ofert pracy", () => {
    const { result } = renderHook(() => useJobs(), { wrapper });
    act(() => {
      result.current.setJobs(mockJobs);
    });

    expect(result.current.jobs).toHaveLength(3);
    expect(result.current.filteredJobs).toHaveLength(3);
    expect(result.current.filteredJobs[0].id).toBe("1");
  });

  describe("Filtrowanie (useMemo logic)", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const setupHookWithJobs = () => {
      const utils = renderHook(() => useJobs(), { wrapper });
      act(() => {
        utils.result.current.setJobs(mockJobs);
      });
      return utils;
    };

    it("powinien filtrować po wpisanej frazie (tytuł, firma, technologia)", () => {
      const { result } = setupHookWithJobs();

      act(() => result.current.setSearchQuery("react"));
      expect(result.current.filteredJobs).toHaveLength(1);
      expect(result.current.filteredJobs[0].id).toBe("1");

      act(() => result.current.setSearchQuery("corporate"));
      expect(result.current.filteredJobs).toHaveLength(1);
      expect(result.current.filteredJobs[0].id).toBe("2");

      act(() => result.current.setSearchQuery("css"));
      expect(result.current.filteredJobs).toHaveLength(1);
      expect(result.current.filteredJobs[0].id).toBe("3");
    });

    it("powinien filtrować po poziomie doświadczenie (seniority)", () => {
      const { result } = setupHookWithJobs();

      act(() => result.current.setSelectedSeniority("senior"));
      expect(result.current.filteredJobs).toHaveLength(1);
      expect(result.current.filteredJobs[0].id).toBe("1");

      act(() => result.current.setSelectedSeniority("mid"));
      expect(result.current.filteredJobs).toHaveLength(1);
      expect(result.current.filteredJobs[0].id).toBe("2");

      act(() => result.current.setSelectedSeniority("junior"));
      expect(result.current.filteredJobs).toHaveLength(1);
      expect(result.current.filteredJobs[0].id).toBe("3");
    });

    it("powinien filtrować po trybie pracy (remote, hybrid, office)", () => {
      const { result } = setupHookWithJobs();

      act(() => result.current.setSelectedWorkMode("remote"));
      expect(result.current.filteredJobs).toHaveLength(1);
      expect(result.current.filteredJobs[0].id).toBe("1");

      act(() => result.current.setSelectedWorkMode("hybrid"));
      expect(result.current.filteredJobs).toHaveLength(1);
      expect(result.current.filteredJobs[0].id).toBe("2");

      act(() => result.current.setSelectedWorkMode("office"));
      expect(result.current.filteredJobs).toHaveLength(1);
      expect(result.current.filteredJobs[0].id).toBe("3");
    });

    it("powinien łączyć kilka filtrów naraz", () => {
      const { result } = setupHookWithJobs();

      act(() => {
        result.current.setSelectedWorkMode("remote");
        result.current.setSelectedSeniority("junior");
      });

      expect(result.current.filteredJobs).toHaveLength(0);

      act(() => {
        result.current.setSelectedWorkMode("office");
        result.current.setSelectedSeniority("junior");
      });

      expect(result.current.filteredJobs).toHaveLength(1);
      expect(result.current.filteredJobs[0].id).toBe("3");
    });
  });

  describe("Sortowanie i akcje", () => {
    it("powinien prawidłowo sortować po max_annual_salary malejąco", () => {
      const { result } = renderHook(() => useJobs(), { wrapper });

      act(() => {
        result.current.setJobs(mockJobs);
        result.current.setSortBy("salary_desc");
      });

      expect(result.current.filteredJobs[0].id).toBe("1");
      expect(result.current.filteredJobs[1].id).toBe("2");
      expect(result.current.filteredJobs[2].id).toBe("3");
    });

    it("powinien prawidłowo sortować po max_annual_salary rosnąco", () => {
      const { result } = renderHook(() => useJobs(), { wrapper });

      act(() => {
        result.current.setJobs(mockJobs);
        result.current.setSortBy("salary_asc");
      });

      expect(result.current.filteredJobs[0].id).toBe("3");
      expect(result.current.filteredJobs[1].id).toBe("2");
      expect(result.current.filteredJobs[2].id).toBe("1");
    });

    it("powinien prawidłowo sortować po dacie malejąco (newest)", () => {
      const { result } = renderHook(() => useJobs(), { wrapper });

      act(() => {
        result.current.setJobs([mockJobs[2], mockJobs[0], mockJobs[1]]);
        result.current.setSortBy("newest");
      });

      expect(result.current.filteredJobs[0].id).toBe("1");
      expect(result.current.filteredJobs[1].id).toBe("2");
      expect(result.current.filteredJobs[2].id).toBe("3");
    });

    it("powinien czyścic filtry za pomocą clearFilters", () => {
      const { result } = renderHook(() => useJobs(), { wrapper });
      act(() => {
        result.current.setSearchQuery("test");
        result.current.setSelectedSeniority("senior");
        result.current.setSelectedWorkMode("remote");
        result.current.setSortBy("salary_desc");
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.searchQuery).toBe("");
      expect(result.current.selectedSeniority).toBeNull();
      expect(result.current.selectedWorkMode).toBeNull();
      expect(result.current.sortBy).toBe("newest");
    });

    it("powinien poprawnie wyszukiwać pojedynczą ofertę po ID", () => {
      const { result } = renderHook(() => useJobs(), { wrapper });

      act(() => {
        result.current.setJobs(mockJobs);
      });

      const job = result.current.getJobById("2");
      expect(job).toBeDefined();
      expect(job?.title).toBe("Mid Angular Developer");

      const notFoundJob = result.current.getJobById("999");
      expect(notFoundJob).toBeUndefined();
    });
  });
});
