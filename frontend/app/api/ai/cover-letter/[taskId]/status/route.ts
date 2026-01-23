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
        `${process.env.GATEWAY_URL}/api/ai/generate/cover-letter/${taskId}/status`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        return NextResponse.json(data, { status: res.status });
      }

      return NextResponse.json(data);
    } catch (error: any) {
      console.error("Cover letter status API error:", error);
      return NextResponse.json(
        { detail: error.message || "Internal server error" },
        { status: 500 },
      );
    }
  },
);
