"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  CoverLetterGenerationStatus,
  CoverLetterGenerationResponse,
  CoverLetterStatusResponse,
} from "@/app/ts/types";
import { parseErrorDetail } from "@/app/lib/parseRateLimiterErrorDetail";

interface UseCoverLetterGenerationReturn {
  taskId: string | null;
  status: CoverLetterGenerationStatus | null;
  error: string | null;
  isLoading: boolean;
  createdAt: string | null;
  completedAt: string | null;
  generateCoverLetter: (jobOffer: string, companyInfo: string) => Promise<void>;
  resetState: () => void;
  downloadCoverLetter: () => Promise<void>;
}

export function useCoverLetterGeneration(): UseCoverLetterGenerationReturn {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<CoverLetterGenerationStatus | null>(
    null,
  );
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
    async (
      taskIdToCheck: string,
    ): Promise<CoverLetterStatusResponse | null> => {
      if (!isMountedRef.current) return null;

      try {
        const response = await fetch(
          `/api/ai/cover-letter/${taskIdToCheck}/status`,
          {
            credentials: "include",
          },
        );

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

        const data: CoverLetterStatusResponse = await response.json();

        if (!isMountedRef.current) return null;

        setStatus(data.status);
        if (data.error) setError(data.error);
        if (data.created_at) setCreatedAt(data.created_at);
        if (data.completed_at) setCompletedAt(data.completed_at);

        if (data.status === "COMPLETED" || data.status === "FAILED") {
          setIsLoading(false);
        }

        return data;
      } catch (error: any) {
        console.error("Cover letter status check error:", error);
        if (!isMountedRef.current) return null;
        setError(error.message || "Failed to check status");
        setIsLoading(false);
        return null;
      }
    },
    [],
  );

  // Polling effect
  useEffect(() => {
    if (!taskId || status === "COMPLETED" || status === "FAILED") {
      return;
    }

    pollingIntervalRef.current = setInterval(async () => {
      if (!isMountedRef.current) {
        if (pollingIntervalRef.current)
          clearInterval(pollingIntervalRef.current);
        return;
      }
      try {
        const res = await checkStatus(taskId);
        if (res && (res.status === "COMPLETED" || res.status === "FAILED")) {
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
  }, [taskId, status, checkStatus]);

  // Function to start cover letter generation
  const generateCoverLetter = useCallback(
    async (jobOffer: string, companyInfo: string): Promise<void> => {
      if (!isMountedRef.current) return;

      setIsLoading(true);
      setError(null);
      setTaskId(null);
      setStatus(null);
      setCreatedAt(null);
      setCompletedAt(null);

      try {
        const response = await fetch(`/api/ai/generate/cover-letter`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_offer: jobOffer,
            company_info: companyInfo,
          }),
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

        const data: CoverLetterGenerationResponse = await response.json();

        if (!isMountedRef.current) return;

        setTaskId(data.task_id);
        setStatus(data.status);
      } catch (error: any) {
        console.error("Cover letter generation error:", error);
        if (!isMountedRef.current) return;
        setError(error.message || "Failed to generate cover letter");
        setIsLoading(false);
      }
    },
    [],
  );

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

  // Function to download the generated cover letter
  const downloadCoverLetter = useCallback(async (): Promise<void> => {
    if (!taskId) {
      setError("No task ID available for download");
      return;
    }

    try {
      const response = await fetch(
        `/api/ai/cover-letter/${encodeURIComponent(taskId)}/download`,
        {
          credentials: "include",
        },
      );

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
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `cover_letter_${taskId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } catch (error: any) {
      console.error("Cover letter download error:", error);
      setError(error.message || "Failed to download cover letter");
    }
  }, [taskId]);

  return {
    taskId,
    status,
    error,
    isLoading,
    createdAt,
    completedAt,
    generateCoverLetter,
    resetState,
    downloadCoverLetter,
  };
}
