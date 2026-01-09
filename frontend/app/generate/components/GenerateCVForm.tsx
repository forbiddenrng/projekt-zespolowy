"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCVGeneration } from "@/app/hooks/useCVGeneration";
import {
  FiFileText,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";

export default function GenerateCVForm() {
  const [jobOffer, setJobOffer] = useState("");

  const {
    taskId,
    status,
    error,
    isLoading,
    createdAt,
    completedAt,
    generateCV,
    resetState,
    downloadCV,
  } = useCVGeneration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobOffer.trim()) {
      alert("Proszę wkleić treść oferty pracy");
      return;
    }

    await generateCV(jobOffer);
  };

  const handleReset = () => {
    setJobOffer("");
    resetState();
  };

  const handleDownload = async () => {
    await downloadCV();
  };

  // Status badge color
  const getStatusColor = () => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500";
      case "FAILED":
        return "bg-red-500";
      case "PROCESSING":
        return "bg-blue-500";
      case "PENDING":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  // Status label
  const getStatusLabel = () => {
    switch (status) {
      case "COMPLETED":
        return "Ukończono";
      case "FAILED":
        return "Błąd";
      case "PROCESSING":
        return "Generowanie...";
      case "PENDING":
        return "Oczekuje";
      default:
        return "Nieznany";
    }
  };

  return (
    <div className="space-y-6">
      {/* Formularz generowania */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiFileText className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>
                  Wklej treść oferty pracy, a AI wygeneruje dla Ciebie
                  spersonalizowane CV w formacie PDF
                </CardTitle>
                {/* <CardDescription className="mt-1">
                  Wklej treść oferty pracy, a AI wygeneruje dla Ciebie
                  spersonalizowane CV w formacie PDF
                </CardDescription >*/}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Textarea dla oferty pracy */}
            <div>
              <Textarea
                id="job-offer"
                placeholder="Wklej tutaj treść oferty pracy (stanowisko, wymagania, obowiązki...)"
                value={jobOffer}
                onChange={(e) => setJobOffer(e.target.value)}
                rows={12}
                disabled={isLoading}
                className="resize-none"
              />
            </div>

            {/* Przyciski akcji */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isLoading || status === "PROCESSING"}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    Generowanie...
                  </>
                ) : (
                  <>
                    <FiFileText />
                    Generuj CV
                  </>
                )}
              </Button>

              {(taskId || error) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Resetuj
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Status generowania */}
      {taskId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiClock className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Status generowania</CardTitle>
              </div>
              <Badge className={getStatusColor()}>{getStatusLabel()}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Task ID */}
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">
                ID zadania
              </span>
              <code className="text-xs bg-secondary px-3 py-1 rounded font-mono">
                {taskId}
              </code>
            </div>

            {/* Daty */}
            {createdAt && (
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">
                  Utworzono
                </span>
                <span className="text-sm text-foreground">
                  {new Date(createdAt).toLocaleString("pl-PL")}
                </span>
              </div>
            )}

            {completedAt && (
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">
                  Ukończono
                </span>
                <span className="text-sm text-foreground">
                  {new Date(completedAt).toLocaleString("pl-PL")}
                </span>
              </div>
            )}

            {/* Loading skeleton podczas generowania */}
            {status === "PROCESSING" && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <FiRefreshCw className="animate-spin" />
                  <span>Trwa generowanie CV...</span>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}

            {/* Przycisk pobierania PDF */}
            {status === "COMPLETED" && (
              <div className="pt-4">
                <Button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2"
                  variant="default"
                >
                  <FiDownload />
                  Pobierz CV (PDF)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alert błędu */}
      {error && (
        <Alert variant="destructive">
          <FiAlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Alert sukcesu */}
      {status === "COMPLETED" && !error && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <FiCheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            CV zostało pomyślnie wygenerowane! Możesz je teraz pobrać.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
