import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = auth0.withApiAuthRequired(
  async (
    _req: Request,
    ctx: { params: Promise<Record<string, string | string[]>> } | undefined,
  ) => {
    try {
      const resolvedParams = await ctx?.params;

      if (
        !resolvedParams?.taskId ||
        typeof resolvedParams.taskId !== "string"
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
        `${process.env.GATEWAY_URL}/api/ai/cv/${encodeURIComponent(taskId)}/download`,
        {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        return new NextResponse(errorText, {
          status: response.status,
          headers: {
            "Content-Type":
              response.headers.get("content-type") ?? "text/plain",
          },
        });
      }

      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="cv_${encodeURIComponent(taskId)}.pdf"`,
        },
      });
    } catch (error: any) {
      console.error("CV download API error:", error);
      return NextResponse.json(
        { detail: error.message || "Internal server error" },
        { status: 500 },
      );
    }
  },
);
