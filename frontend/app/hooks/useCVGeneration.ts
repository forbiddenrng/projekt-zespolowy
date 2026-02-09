"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  CVGenerationResponse,
  CVStatusResponse,
  CVGenerationStatus,
} from "@/app/ts/types";
import { parseErrorDetail } from "@/app/lib/parseRateLimiterErrorDetail";

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
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Function to check status
  const checkStatus = useCallback(
    async (id: string): Promise<CVStatusResponse | undefined> => {
      if (!isMountedRef.current) return;

      try {
        const response = await fetch(`/api/ai/generate/cv/${id}/status`, {
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          const text = await response.text();
          let errorJson: any = null;
          try {
            errorJson = JSON.parse(text);
          } catch {
            // Text is not JSON
          }

          const errorMessage = parseErrorDetail(errorJson, response.status);
          throw new Error(errorMessage);
        }

        const data: CVStatusResponse = await response.json();

        if (!isMountedRef.current) return;

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
      } catch (error: any) {
        console.error("CV status check error:", error);
        if (!isMountedRef.current) return;
        setError(error.message || "Failed to check status");
        setIsLoading(false);

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    },
    [],
  );

  // Polling effect
  useEffect(() => {
    if (!taskId || !isMountedRef.current) return;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    pollingIntervalRef.current = setInterval(async () => {
      if (!isMountedRef.current) {
        if (pollingIntervalRef.current)
          clearInterval(pollingIntervalRef.current);
        return;
      }
      try {
        const response = await checkStatus(taskId);
        if (
          response &&
          (response.status === "COMPLETED" || response.status === "FAILED")
        ) {
          if (pollingIntervalRef.current)
            clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } catch (error) {
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
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);
    setTaskId(null);
    setStatus(null);
    setCreatedAt(null);
    setCompletedAt(null);

    try {
      const response = await fetch(`/api/ai/generate/cv`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_offer: jobOffer }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorJson: any = null;
        try {
          errorJson = JSON.parse(text);
        } catch {
          // Text is not JSON
        }

        const errorMessage = parseErrorDetail(errorJson, response.status);
        throw new Error(errorMessage);
      }

      const data: CVGenerationResponse = await response.json();

      if (!isMountedRef.current) return;

      setTaskId(data.task_id);
      setStatus(data.status);
    } catch (error: any) {
      console.error("CV generation error:", error);
      if (!isMountedRef.current) return;
      setError(error.message || "Failed to generate CV");
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
      const response = await fetch(`/api/ai/cv/${taskId}/download`, {
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        let errorJson: any = null;
        try {
          errorJson = JSON.parse(text);
        } catch {
          // Text is not JSON
        }

        const errorMessage = parseErrorDetail(errorJson, response.status);
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `resume_${taskId}.pdf`; // Consistent with "Resume" naming
      document.body.appendChild(anchor);
      anchor.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } catch (error: any) {
      console.error("Resume download error:", error);
      if (!isMountedRef.current) return;
      setError(error.message || "Failed to download CV");
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
