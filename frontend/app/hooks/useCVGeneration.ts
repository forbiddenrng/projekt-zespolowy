import { useState, useEffect, useCallback, useRef } from "react";
import type {
  CVGenerationResponse,
  CVStatusResponse,
  CVGenerationStatus,
} from "@/app/ts/types";
import { auth0 } from "@/app/lib/auth0";

interface UseCVGenerationReturn {
  taskId: string | null;
  status: CVGenerationStatus | null;
  error: string | null;
  isLoading: boolean;
  createdAt: string | null;
  completedAt: string | null;
  generateCV: (jobOffer: string) => Promise<void>;
  resetState: () => void;
  downloadCV: () => Promise<void>;
}

export function useCVGeneration(): UseCVGenerationReturn {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<CVGenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check status
  const checkStatus = useCallback(
    async (id: string): Promise<CVStatusResponse | undefined> => {
      try {
        const tokenResponse = await fetch("/api/auth/token");
        if (!tokenResponse.ok) {
          throw new Error("Failed to get access token");
        }
        const { accessToken } = await tokenResponse.json();

        const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL;

        const response = await fetch(
          `${gatewayUrl}/api/ai/generate/cv/${id}/status`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to check status");
        }

        const data: CVStatusResponse = await response.json();

        setStatus(data.status);
        setCreatedAt(data.created_at || null);
        setCompletedAt(data.completed_at || null);

        if (data.error) {
          setError(data.error);
        }

        // Stop polling if completed or failed
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsLoading(false);
        }

        return data;
      } catch (err: any) {
        console.error("Status check error:", err);
        setError(err.message || "Failed to check status");
        setIsLoading(false);

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!taskId) return;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await checkStatus(taskId);
        if (res && (res.status === "COMPLETED" || res.status === "FAILED")) {
          if (pollingIntervalRef.current)
            clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } catch (e) {
        if (pollingIntervalRef.current)
          clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    };
  }, [taskId, checkStatus]);

  // Function to start CV generation
  const generateCV = useCallback(async (jobOffer: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setTaskId(null);
    setStatus(null);
    setCreatedAt(null);
    setCompletedAt(null);

    try {
      const tokenResponse = await fetch("/api/auth/token");
      if (!tokenResponse.ok) {
        throw new Error("Failed to get access token");
      }
      const { accessToken } = await tokenResponse.json();

      const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL;
      const response = await fetch(`${gatewayUrl}/api/ai/generate/cv`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ job_offer: jobOffer }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errJson: any = null;
        try {
          errJson = JSON.parse(text);
        } catch {}
        throw new Error(
          errJson?.detail ||
            errJson?.message ||
            `HTTP ${response.status}: ${text.slice(0, 120)}`
        );
      }

      const data: CVGenerationResponse = await response.json();

      setTaskId(data.task_id);
      setStatus(data.status);
    } catch (err: any) {
      console.error("CV generation error:", err);
      setError(err.message || "Failed to generate CV");
      setIsLoading(false);
    }
  }, []);

  // Function to reset state
  const resetState = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setTaskId(null);
    setStatus(null);
    setError(null);
    setIsLoading(false);
    setCreatedAt(null);
    setCompletedAt(null);
  }, []);

  // Function to download the generated CV
  const downloadCV = useCallback(async (): Promise<void> => {
    if (!taskId) {
      setError("No task ID available for download");
      return;
    }

    try {
      const tokenResponse = await fetch("/api/auth/token");
      if (!tokenResponse.ok) {
        throw new Error("Failed to get access token");
      }
      const { accessToken } = await tokenResponse.json();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_GATEWAY_URL}/api/ai/cv/${taskId}/download`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!res.ok) throw new Error(`Download failed ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cv_${taskId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download error:", err);
      setError(err.message || "Failed to download CV");
    }
  }, [taskId]);

  return {
    taskId,
    status,
    error,
    isLoading,
    createdAt,
    completedAt,
    generateCV,
    resetState,
    downloadCV,
  };
}
