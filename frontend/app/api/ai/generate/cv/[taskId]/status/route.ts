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
        `${process.env.GATEWAY_URL}/api/ai/generate/cv/${encodeURIComponent(taskId)}/status`,
        {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );

      const contentType = response.headers.get("content-type") ?? "";
      const responseText = await response.text();

      if (contentType.includes("application/json")) {
        try {
          const data = JSON.parse(responseText);
          return NextResponse.json(data, { status: response.status });
        } catch {
          // Fallback if parsing fails
        }
      }

      return new NextResponse(responseText, {
        status: response.status,
        headers: { "Content-Type": contentType || "text/plain" },
      });
    } catch (error: any) {
      console.error("CV status API error:", error);
      return NextResponse.json(
        { detail: error?.message ?? "Internal server error" },
        { status: 500 },
      );
    }
  },
);
