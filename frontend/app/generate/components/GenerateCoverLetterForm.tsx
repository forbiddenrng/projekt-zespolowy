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
import { useCoverLetterGeneration } from "@/app/hooks/useCoverLetterGeneration";
import {
  FiFileText,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiBriefcase,
  FiInfo,
} from "react-icons/fi";

export default function GenerateCoverLetterForm() {
  const [jobOffer, setJobOffer] = useState("");
  const [companyInfo, setCompanyInfo] = useState("");

  const {
    taskId,
    status,
    error,
    isLoading,
    createdAt,
    completedAt,
    generateCoverLetter,
    resetState,
    downloadCoverLetter,
  } = useCoverLetterGeneration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobOffer.trim()) {
      alert("Please paste the job offer content");
      return;
    }

    await generateCoverLetter(jobOffer, companyInfo);
  };

  const handleReset = () => {
    setJobOffer("");
    setCompanyInfo("");
    resetState();
  };

  const handleDownload = async () => {
    await downloadCoverLetter();
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
        return "Completed";
      case "FAILED":
        return "Failed";
      case "PROCESSING":
        return "Generating...";
      case "PENDING":
        return "Pending";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiFileText className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>
                  Paste the job offer content and company information, and AI
                  will generate a personalized cover letter for you in PDF
                  format
                </CardTitle>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Textarea for job offer */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiBriefcase className="w-4 h-4 text-muted-foreground" />
                <label
                  htmlFor="job-offer"
                  className="text-sm font-medium text-foreground"
                >
                  Job Offer Content
                </label>
              </div>
              <Textarea
                id="job-offer"
                placeholder="Paste the job offer content here (position, requirements, responsibilities...)"
                value={jobOffer}
                onChange={(e) => setJobOffer(e.target.value)}
                rows={10}
                disabled={isLoading}
                className="resize-none"
              />
            </div>

            {/* Textarea for company info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiInfo className="w-4 h-4 text-muted-foreground" />
                <label
                  htmlFor="company-info"
                  className="text-sm font-medium text-foreground"
                >
                  Company Information (optional)
                </label>
              </div>
              <Textarea
                id="company-info"
                placeholder="Paste information about the company here (mission, values, culture, projects...)"
                value={companyInfo}
                onChange={(e) => setCompanyInfo(e.target.value)}
                rows={6}
                disabled={isLoading}
                className="resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Providing company information helps AI create a more
                personalized cover letter
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isLoading || status === "PROCESSING"}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FiFileText />
                    Generate Cover Letter
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
                  Reset
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Generation Status */}
      {taskId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiClock className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Generation Status</CardTitle>
              </div>
              <Badge className={getStatusColor()}>{getStatusLabel()}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Task ID */}
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">
                Task ID
              </span>
              <code className="text-xs bg-secondary px-3 py-1 rounded font-mono">
                {taskId}
              </code>
            </div>

            {/* Dates */}
            {createdAt && (
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">
                  Created at
                </span>
                <span className="text-sm text-foreground">
                  {new Date(createdAt).toLocaleString("en-US")}
                </span>
              </div>
            )}

            {completedAt && (
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">
                  Completed at
                </span>
                <span className="text-sm text-foreground">
                  {new Date(completedAt).toLocaleString("en-US")}
                </span>
              </div>
            )}

            {/* Loading skeleton during generation */}
            {status === "PROCESSING" && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <FiRefreshCw className="animate-spin" />
                  <span>Cover letter generation in progress...</span>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}

            {/* PDF Download Button */}
            {status === "COMPLETED" && (
              <div className="pt-4">
                <Button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2"
                  variant="default"
                >
                  <FiDownload />
                  Download Cover Letter (PDF)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <FiAlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {status === "COMPLETED" && !error && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <FiCheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Cover letter generated successfully! You can download it now.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
