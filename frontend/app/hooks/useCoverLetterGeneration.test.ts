import { renderHook, act } from "@testing-library/react";
import { useCoverLetterGeneration } from "./useCoverLetterGeneration";
import { parseErrorDetail } from "@/app/lib/parseRateLimiterErrorDetail";

jest.mock("../lib/parseRateLimiterErrorDetail", () => ({
  parseErrorDetail: jest.fn(),
}));

global.fetch = jest.fn() as jest.Mock;

describe("useCoverLetterGeneration Hook", () => {
  const mockCreateObjectURL = jest.fn();
  const mockRevokeObjectURL = jest.fn();
  const mockAppendChild = jest
    .spyOn(document.body, "appendChild")
    .mockImplementation(() => document.body as any);
  const mockRemoveChild = jest
    .spyOn(document.body, "removeChild")
    .mockImplementation(() => document.body as any);
  const mockCreateElement = jest.spyOn(document, "createElement");
  const originalConsoleError = console.error;

  beforeAll(() => {
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    console.error = jest.fn();

    (parseErrorDetail as jest.Mock).mockImplementation((json, status) => {
      return json?.error || `Error ${status}`;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    console.error = originalConsoleError;
  });

  describe("Inicjalizacja", () => {
    it("powinien inicjalizować się z poprawnymi wartościami domyślnymi", () => {
      const { result } = renderHook(() => useCoverLetterGeneration());

      expect(result.current.taskId).toBeNull();
      expect(result.current.status).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.createdAt).toBeNull();
      expect(result.current.completedAt).toBeNull();
    });
  });

  describe("Generowanie Listu Motywacyjnego (generateCoverLetter)", () => {
    it("powinien ustawić stan ładowania i zaktualizować taskId po udanym strzale do API", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: "task-123", status: "PENDING" }),
      });

      const { result } = renderHook(() => useCoverLetterGeneration());

      await act(async () => {
        await result.current.generateCoverLetter("Job Offer", "Company Info");
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/ai/generate/cover-letter",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            job_offer: "Job Offer",
            company_info: "Company Info",
          }),
        }),
      );

      expect(result.current.taskId).toBe("task-123");
      expect(result.current.status).toBe("PENDING");
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("powinien obsłużyć błąd przy generowaniu i ustawić odpowiednią wiadomość", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: "Rate limit exceeded" }),
        text: async () => JSON.stringify({ error: "Rate limit exceeded" }),
      });

      const { result } = renderHook(() => useCoverLetterGeneration());

      await act(async () => {
        await result.current.generateCoverLetter("Job", "Company");
      });

      expect(result.current.error).toBe("Rate limit exceeded");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.taskId).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Sprawdzanie Statusu (Polling / checkStatus)", () => {
    it("powinien pobierać status co 2 sekundy po ustawieniu taskId i zatrzymać się przy COMPLETED", async () => {
      const { result } = renderHook(() => useCoverLetterGeneration());

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: "task-999", status: "PENDING" }),
      });

      await act(async () => {
        await result.current.generateCoverLetter("Job", "Company");
      });

      expect(result.current.taskId).toBe("task-999");
      expect(result.current.status).toBe("PENDING");

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "IN_PROGRESS" }),
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.status).toBe("IN_PROGRESS");
      expect(result.current.isLoading).toBe(true);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "COMPLETED",
          created_at: "2024-01-01",
          completed_at: "2024-01-02",
        }),
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.status).toBe("COMPLETED");
      expect(result.current.createdAt).toBe("2024-01-01");
      expect(result.current.completedAt).toBe("2024-01-02");
      expect(result.current.isLoading).toBe(false);

      (global.fetch as jest.Mock).mockClear();
      await act(async () => {
        jest.advanceTimersByTime(4000);
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("powinien przerwać polling w przypadku błędu z backendu", async () => {
      const { result } = renderHook(() => useCoverLetterGeneration());

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: "task-err", status: "PENDING" }),
      });

      await act(async () => {
        await result.current.generateCoverLetter("Job", "Company");
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "FAILED", error: "Generation failed" }),
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.status).toBe("FAILED");
      expect(result.current.error).toBe("Generation failed");
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Pobieranie Listu (downloadCoverLetter)", () => {
    it("powinien zgłosić błąd, jeśli nie ma dostępnego taskId", async () => {
      const { result } = renderHook(() => useCoverLetterGeneration());

      await act(async () => {
        await result.current.downloadCoverLetter();
      });

      expect(result.current.error).toBe("No task ID available for download");
    });

    it("powinien poprawnie zasymulować pobieranie pliku PDF za pomocą wirtualnego tagu <a>", async () => {
      const { result } = renderHook(() => useCoverLetterGeneration());

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: "task-pdf", status: "COMPLETED" }),
      });

      await act(async () => {
        await result.current.generateCoverLetter("Job", "Company");
      });

      const mockBlob = new Blob(["test"], { type: "application/pdf" });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const mockAnchorClick = jest.fn();
      const mockAnchorElement = {
        href: "",
        download: "",
        click: mockAnchorClick,
      } as unknown as HTMLAnchorElement;

      mockCreateElement.mockReturnValueOnce(mockAnchorElement as any);
      mockCreateObjectURL.mockReturnValueOnce("blob:test-url");

      await act(async () => {
        await result.current.downloadCoverLetter();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/ai/cover-letter/task-pdf/download",
        expect.any(Object),
      );
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockAnchorElement.href).toBe("blob:test-url");
      expect(mockAnchorElement.download).toBe("cover_letter_task-pdf.pdf");
      expect(mockAppendChild).toHaveBeenCalledWith(mockAnchorElement);
      expect(mockAnchorClick).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");
      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchorElement);
    });
  });

  describe("Resetowanie stanu (resetState)", () => {
    it("powinien wyczyścić wszystkie zmienne i zatrzymać interwał", async () => {
      const { result } = renderHook(() => useCoverLetterGeneration());

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: "task-reset", status: "PENDING" }),
      });

      await act(async () => {
        await result.current.generateCoverLetter("Job", "Company");
      });

      expect(result.current.taskId).toBe("task-reset");

      await act(async () => {
        result.current.resetState();
      });

      expect(result.current.taskId).toBeNull();
      expect(result.current.status).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);

      (global.fetch as jest.Mock).mockClear();
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
