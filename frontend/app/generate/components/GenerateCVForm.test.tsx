import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GenerateCVForm from "./GenerateCVForm";
import { useCVGeneration } from "@/app/hooks/useCVGeneration";

jest.mock("../../hooks/useCVGeneration");

const mockUseCVGeneration = useCVGeneration as jest.MockedFunction<
  typeof useCVGeneration
>;

describe("GenerateCVForm Component", () => {
  const mockGenerateCV = jest.fn();
  const mockResetState = jest.fn();
  const mockDownloadCV = jest.fn();

  const defaultHookValue = {
    taskId: null,
    status: null as any,
    error: null,
    isLoading: false,
    createdAt: null,
    completedAt: null,
    generateCV: mockGenerateCV,
    resetState: mockResetState,
    downloadCV: mockDownloadCV,
  } as ReturnType<typeof useCVGeneration>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCVGeneration.mockReturnValue(defaultHookValue);
    window.alert = jest.fn();
  });

  it("powinien poprawnie renderować początkowy formularz", () => {
    render(<GenerateCVForm />);
    expect(
      screen.getByPlaceholderText(/Paste the job offer content here/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Generate Resume/i }),
    ).toBeInTheDocument();
  });

  it("powinien pokazać alert i zablokować wysłanie, jeśli oferta pracy jest pust", () => {
    render(<GenerateCVForm />);
    const submitButton = screen.getByRole("button", {
      name: /Generate Resume/i,
    });
    fireEvent.click(submitButton);
    expect(window.alert).toHaveBeenCalledWith(
      "Please paste the job offer content",
    );
    expect(mockGenerateCV).not.toHaveBeenCalled();
  });

  it("powinien wywołać generateCV z odpowiednimi danymi po wypełnieniu i wysłaniu formularza", () => {
    render(<GenerateCVForm />);
    const jobOfferInput = screen.getByPlaceholderText(
      /Paste the job offer content here/i,
    );
    const submitButton = screen.getByRole("button", {
      name: /Generate Resume/i,
    });
    fireEvent.change(jobOfferInput, {
      target: { value: "Frontend Developer at Google" },
    });
    fireEvent.click(submitButton);
    expect(mockGenerateCV).toHaveBeenCalledWith("Frontend Developer at Google");
  });

  it("powinien odpowiednio reagować na stan ładowania (PROCESSING)", () => {
    mockUseCVGeneration.mockReturnValue({
      ...defaultHookValue,
      taskId: "cv-task-456",
      status: "PROCESSING" as any,
      isLoading: true,
    });

    render(<GenerateCVForm />);
    const loadingButton = screen.getByRole("button", {
      name: /Generating.../i,
    });
    expect(loadingButton).toBeDisabled();
    expect(screen.getByText("cv-task-456")).toBeInTheDocument();
    expect(
      screen.getByText("Resume generation in progress..."),
    ).toBeInTheDocument();
  });

  it("powinien pokazać komunikat sukcesu i przycisku pobierania w stanie COMPLETED", () => {
    mockUseCVGeneration.mockReturnValue({
      ...defaultHookValue,
      taskId: "cv-test-456",
      status: "COMPLETED" as any,
      completedAt: "2026-03-24T15:30:00.000Z",
    });

    render(<GenerateCVForm />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(
      screen.getByText(/Resume has been generated successfully!/i),
    ).toBeInTheDocument();

    const downloadButton = screen.getByRole("button", {
      name: /Download Resume/i,
    });
    expect(downloadButton).toBeInTheDocument();

    fireEvent.click(downloadButton);
    expect(mockDownloadCV).toHaveBeenCalled();
  });

  it("powinien wyświetlać komunikat błędu, jeśli generowanie się nie powiedzie", () => {
    mockUseCVGeneration.mockReturnValue({
      ...defaultHookValue,
      taskId: "cv-task-456",
      status: "FAILED" as any,
      error: "Błąd API podczas tworzenia CV",
    });

    render(<GenerateCVForm />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(
      screen.getByText("Błąd API podczas tworzenia CV"),
    ).toBeInTheDocument();
  });

  it("powinien resetowć formularz po kliknięciu przycisku Reset", () => {
    mockUseCVGeneration.mockReturnValue({
      ...defaultHookValue,
      taskId: "cv-task-456",
    });
    render(<GenerateCVForm />);
    const jobOfferInput = screen.getByPlaceholderText(
      /Paste the job offer content here/i,
    );
    fireEvent.change(jobOfferInput, {
      target: { value: "Przykładowy tekst oferty" },
    });
    expect(jobOfferInput).toHaveValue("Przykładowy tekst oferty");
    const resetButton = screen.getByRole("button", { name: /Reset/i });
    fireEvent.click(resetButton);
    expect(jobOfferInput).toHaveValue("");
    expect(mockResetState).toHaveBeenCalled();
  });
});
