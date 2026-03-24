import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GenerateCoverLetterForm from "./GenerateCoverLetterForm";
import { useCoverLetterGeneration } from "@/app/hooks/useCoverLetterGeneration";

jest.mock("../../hooks/useCoverLetterGeneration");

const mockUseCoverLetterGeneration =
  useCoverLetterGeneration as jest.MockedFunction<
    typeof useCoverLetterGeneration
  >;

describe("GenerateCoverLetterForm Component", () => {
  const mockGenerateCoverLetter = jest.fn();
  const mockResetState = jest.fn();
  const mockDownloadCoverLetter = jest.fn();

  const defaultHookValue = {
    taskId: null,
    status: null as any,
    error: null,
    isLoading: false,
    createdAt: null,
    completedAt: null,
    generateCoverLetter: mockGenerateCoverLetter,
    resetState: mockResetState,
    downloadCoverLetter: mockDownloadCoverLetter,
  } as ReturnType<typeof useCoverLetterGeneration>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCoverLetterGeneration.mockReturnValue(defaultHookValue);
    window.alert = jest.fn();
  });

  it("powinien poprawnie renderować początkowy formularz", () => {
    render(<GenerateCoverLetterForm />);
    expect(screen.getByLabelText(/Job Offer Content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Company Information/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Generate Cover Letter/i }),
    ).toBeInTheDocument();
  });

  it("powinien pokazać alert i zablokować wysłanie, jeśli oferta pracy jest pusta", () => {
    render(<GenerateCoverLetterForm />);
    const submitButton = screen.getByRole("button", {
      name: /Generate Cover Letter/i,
    });
    fireEvent.click(submitButton);
    expect(window.alert).toHaveBeenCalledWith(
      "Please paste the job offer content",
    );
    expect(mockGenerateCoverLetter).not.toHaveBeenCalled();
  });

  it("powinien wywołać generateCoverLetter z odpowiednimi danymi po wypełnieniu i wysłaniu formularza", () => {
    render(<GenerateCoverLetterForm />);
    const jobOfferInput = screen.getByLabelText(/Job Offer Content/i);
    const companyInfoInput = screen.getByLabelText(/Company Information/i);
    const submitButton = screen.getByRole("button", {
      name: /Generate Cover Letter/i,
    });
    fireEvent.change(jobOfferInput, {
      target: { value: "Senior React Developer" },
    });
    fireEvent.change(companyInfoInput, {
      target: { value: "Tech Company Inc." },
    });
    fireEvent.click(submitButton);
    expect(mockGenerateCoverLetter).toHaveBeenCalledWith(
      "Senior React Developer",
      "Tech Company Inc.",
    );
  });

  it("powinien odpowiednio reagować na stan ładowania (PROCESSING)", () => {
    mockUseCoverLetterGeneration.mockReturnValue({
      ...defaultHookValue,
      taskId: "task-123",
      status: "PROCESSING" as any, // Rzutowanie statusu
      isLoading: true,
    });
    render(<GenerateCoverLetterForm />);
    const loadingButton = screen.getByRole("button", {
      name: /Generating.../i,
    });
    expect(loadingButton).toBeDisabled();
    expect(screen.getByText("task-123")).toBeInTheDocument();
    expect(
      screen.getByText("Cover letter generation in progress..."),
    ).toBeInTheDocument();
  });

  it("powinien pokazać komunikat sukcesu i przycisk pobierania w stanie COMPLETED", () => {
    mockUseCoverLetterGeneration.mockReturnValue({
      ...defaultHookValue,
      taskId: "task-123",
      status: "COMPLETED" as any, // Rzutowanie statusu
      completedAt: "2026-03-24T12:00:00.000Z",
    });
    render(<GenerateCoverLetterForm />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(
      screen.getByText(/Cover letter generated successfully!/i),
    ).toBeInTheDocument();
    const downloadButton = screen.getByRole("button", {
      name: /Download Cover Letter/i,
    });
    expect(downloadButton).toBeInTheDocument();
    fireEvent.click(downloadButton);
    expect(mockDownloadCoverLetter).toHaveBeenCalled();
  });

  it("powinien wyświetlać komunikat błędu, jeśli generowanie się nie powiedzie", () => {
    mockUseCoverLetterGeneration.mockReturnValue({
      ...defaultHookValue,
      taskId: "task-123",
      status: "FAILED" as any, // Rzutowanie statusu
      error: "Błąd serwera podczas generowania pliku",
    });
    render(<GenerateCoverLetterForm />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(
      screen.getByText("Błąd serwera podczas generowania pliku"),
    ).toBeInTheDocument();
  });

  it("powinien resetować formularz po kliknięciu przycisku Reset", () => {
    mockUseCoverLetterGeneration.mockReturnValue({
      ...defaultHookValue,
      taskId: "task-123",
    });

    render(<GenerateCoverLetterForm />);

    const jobOfferInput = screen.getByLabelText(/Job Offer Content/i);
    fireEvent.change(jobOfferInput, { target: { value: "Testowa oferta" } });
    expect(jobOfferInput).toHaveValue("Testowa oferta");

    const resetButton = screen.getByRole("button", { name: /Reset/i });
    fireEvent.click(resetButton);
    expect(jobOfferInput).toHaveValue("");
    expect(mockResetState).toHaveBeenCalled();
  });
});
