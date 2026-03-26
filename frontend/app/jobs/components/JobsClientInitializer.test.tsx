import React from "react";
import { render } from "@testing-library/react";
import JobsClientInitializer from "./JobsClientInitializer";
import { useJobs } from "./JobsContext";
import { JobModel } from "./JobOfferModel";
import { mock } from "node:test";

jest.mock("../components/JobsContext");

const mockUseJobs = useJobs as jest.MockedFunction<typeof useJobs>;

describe("JobsClientInitializer Component", () => {
  const mockSetJobs = jest.fn();

  const mockJobs: JobModel[] = [
    { id: "1", title: "Frontend Developer" } as JobModel,
    { id: "2", title: "Backend Developer" } as JobModel,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseJobs.mockReturnValue({
      setJobs: mockSetJobs,
    } as any);
  });

  it("powinien być komponentem bez widoku (nie renderować żadnego HTML)", () => {
    const { container } = render(<JobsClientInitializer jobs={mockJobs} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("powinien wywołać setJobs z przekazanymi ofertami zaraz po zamontowaniu", () => {
    render(<JobsClientInitializer jobs={mockJobs} />);
    expect(mockSetJobs).toHaveBeenCalledTimes(1);
    expect(mockSetJobs).toHaveBeenCalledWith(mockJobs);
  });

  it("powinein wywołać setJobs ponownie, jeśli tablica jobs zostanie zaktualizowana", () => {
    const { rerender } = render(<JobsClientInitializer jobs={mockJobs} />);
    expect(mockSetJobs).toHaveBeenCalledTimes(1);

    const newMockJobs: JobModel[] = [
      { id: "3", title: "DevOps Engineer" } as JobModel,
    ];

    rerender(<JobsClientInitializer jobs={newMockJobs} />);
    expect(mockSetJobs).toHaveBeenCalledTimes(2);
    expect(mockSetJobs).toHaveBeenLastCalledWith(newMockJobs);
  });
});
