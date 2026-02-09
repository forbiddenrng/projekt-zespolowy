import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = auth0.withApiAuthRequired(
  async (req: Request, { params }: { params: Promise<{ taskId: string }> }) => {
    try {
      const resolvedParams = await params;

      if (
        !resolvedParams ||
        typeof resolvedParams.taskId !== "string" ||
        !resolvedParams.taskId
      ) {
        return NextResponse.json(
          { detail: "Invalid or missing task ID" },
          { status: 400 },
        );
      }

      const { taskId } = resolvedParams;

      const accessTokenResponse = await auth0.getAccessToken({
        audience: process.env.AUTH0_AUDIENCE,
      });

      const token =
        typeof accessTokenResponse === "string"
          ? accessTokenResponse
          : ((accessTokenResponse as any)?.token ?? null);

      const response = await fetch(
        `${process.env.GATEWAY_URL}/api/ai/cover-letter/${encodeURIComponent(taskId)}/download`,
        {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetail: string;

        try {
          const errorJson = JSON.parse(errorText);
          errorDetail =
            errorJson?.detail ||
            errorJson?.message ||
            `HTTP ${response.status}`;
        } catch {
          // Jeśli to nie JSON, używamy surowego tekstu (przyciętego do 200 znaków dla bezpieczeństwa)
          errorDetail =
            errorText.trim().substring(0, 200) || `HTTP ${response.status}`;
        }

        return NextResponse.json(
          { detail: errorDetail },
          { status: response.status },
        );
      }

      const pdfBuffer = await response.arrayBuffer();

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=cover_letter_${encodeURIComponent(taskId)}.pdf`,
        },
      });
    } catch (error: any) {
      console.error("Cover letter download API error:", error);
      return NextResponse.json(
        { detail: error.message || "Internal server error" },
        { status: 500 },
      );
    }
  },
);
