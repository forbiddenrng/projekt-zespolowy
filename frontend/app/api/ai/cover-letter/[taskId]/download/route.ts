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
          { detail: "Invalid or missing taskId" },
          { status: 400 },
        );
      }
      const { taskId } = resolvedParams;

      const accessTokenResp = await auth0.getAccessToken({
        audience: process.env.AUTH0_AUDIENCE,
      });

      const token =
        typeof accessTokenResp === "string"
          ? accessTokenResp
          : ((accessTokenResp as any)?.token ?? null);

      const res = await fetch(
        `${process.env.GATEWAY_URL}/api/ai/cover-letter/${taskId}/download`,
        {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!res.ok) {
        const text = await res.text();
        let errJson: any = null;
        try {
          errJson = JSON.parse(text);
        } catch {}
        return NextResponse.json(
          { detail: errJson?.detail || `HTTP ${res.status}` },
          { status: res.status },
        );
      }

      const pdfBuffer = await res.arrayBuffer();

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=cover_letter_${taskId}.pdf`,
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
