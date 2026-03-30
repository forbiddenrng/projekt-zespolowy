import { renderHook, act } from "@testing-library/react";
import { useCVGeneration } from "./useCVGeneration";
import { parseErrorDetail } from "@/app/lib/parseRateLimiterErrorDetail";

jest.mock("../lib/parseRateLimiterErrorDetail", () => ({
  parseErrorDetail: jest.fn(),
}));

global.fetch = jest.fn() as jest.Mock;

describe("useCVGeneration Hook", () => {
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
      const { result } = renderHook(() => useCVGeneration());

      expect(result.current.taskId).toBeNull();
      expect(result.current.status).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.createdAt).toBeNull();
      expect(result.current.completedAt).toBeNull();
    });
  });

  describe("Generowanie CV (generateCV)", () => {
    it("powinien ustawić stan ładowania i zaktualizować taskId po udanym żądaniu do API", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: "cv-task-1", status: "PENDING" }),
      });

      const { result } = renderHook(() => useCVGeneration());

      await act(async () => {
        await result.current.generateCV("Frontend Developer Oferta");
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/ai/generate/cv",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ job_offer: "Frontend Developer Oferta" }),
        }),
      );

      expect(result.current.taskId).toBe("cv-task-1");
      expect(result.current.status).toBe("PENDING");
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("powinien obsłużyć błąd przy generowaniu i zapisać komunikat w stanie error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: "Internal Server Error" }),
      });

      const { result } = renderHook(() => useCVGeneration());

      await act(async () => {
        await result.current.generateCV("Oferta Pracy");
      });

      expect(result.current.error).toBe("Internal Server Error");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.taskId).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Odpytywanie o Status (Polling / checkStatus)", () => {
    it("powinien sprawdzać status co 2 sekundy i zatrzymać interwał, gdy status to COMPLETED", async () => {
      const { result } = renderHook(() => useCVGeneration());

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: "task-polling", status: "PENDING" }),
      });

      await act(async () => {
        await result.current.generateCV("Job");
      });

      expect(result.current.taskId).toBe("task-polling");

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "IN_PROGRESS" }),
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/ai/generate/cv/task-polling/status",
        expect.any(Object),
      );
      expect(result.current.status).toBe("IN_PROGRESS");
      expect(result.current.isLoading).toBe(true);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "COMPLETED",
          created_at: "2024-05-10T10:00:00",
          completed_at: "2024-05-10T10:01:00",
        }),
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.status).toBe("COMPLETED");
      expect(result.current.createdAt).toBe("2024-05-10T10:00:00");
      expect(result.current.completedAt).toBe("2024-05-10T10:01:00");
      expect(result.current.isLoading).toBe(false);

      (global.fetch as jest.Mock).mockClear();
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("powinien zatrzymać polling i ustawić błąd, jeśli API zwróci status FAILED", async () => {
      const { result } = renderHook(() => useCVGeneration());

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: "task-failed", status: "PENDING" }),
      });

      await act(async () => {
        await result.current.generateCV("Job");
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "FAILED",
          error: "Generation process failed",
        }),
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.status).toBe("FAILED");
      expect(result.current.error).toBe("Generation process failed");
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Pobieranie CV (downloadCV)", () => {
    it("powinien zwrócić błąd, jeśli podjęto próbę pobrania bez wygenerowanego taskId", async () => {
      const { result } = renderHook(() => useCVGeneration());

      await act(async () => {
        await result.current.downloadCV();
      });

      expect(result.current.error).toBe("No task ID available for download");
    });

    it("powinien poprawnie zasymulować kliknięcie w wygenerowany link z Blobem PDF", async () => {
      const { result } = renderHook(() => useCVGeneration());

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: "cv-pdf-task", status: "COMPLETED" }),
      });

      await act(async () => {
        await result.current.generateCV("Job");
      });

      const mockBlob = new Blob(["test cv content"], {
        type: "application/pdf",
      });
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
      mockCreateObjectURL.mockReturnValueOnce("blob:test-cv-url");

      await act(async () => {
        await result.current.downloadCV();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/ai/cv/cv-pdf-task/download",
        expect.any(Object),
      );
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockAnchorElement.href).toBe("blob:test-cv-url");
      expect(mockAnchorElement.download).toBe("resume_cv-pdf-task.pdf");
      expect(mockAppendChild).toHaveBeenCalledWith(mockAnchorElement);
      expect(mockAnchorClick).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-cv-url");
      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchorElement);
    });
  });

  describe("Czyszczenie stanu (resetState)", () => {
    it("powinien wyzerować wszystkie stany i zatrzymać działające interwały", async () => {
      const { result } = renderHook(() => useCVGeneration());

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: "task-to-reset", status: "PENDING" }),
      });

      await act(async () => {
        await result.current.generateCV("Job Offer");
      });

      expect(result.current.taskId).toBe("task-to-reset");
      expect(result.current.isLoading).toBe(true);

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
