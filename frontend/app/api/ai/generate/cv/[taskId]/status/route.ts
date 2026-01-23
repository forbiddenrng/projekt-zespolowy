import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = auth0.withApiAuthRequired(
  async (_req: Request, ctx: { params: Promise<Record<string, string | string[]>> } | undefined) => {
    try {
      const resolvedParams = await ctx?.params;

      if (!resolvedParams?.taskId || typeof resolvedParams.taskId !== "string") {
        return NextResponse.json(
          { message: "Task ID is required" },
          { status: 400 },
        );
      }

      const accessTokenResp = await auth0.getAccessToken({
        audience: process.env.AUTH0_AUDIENCE,
      });

      const token =
        typeof accessTokenResp === "string"
          ? accessTokenResp
          : ((accessTokenResp as any)?.token ?? null);

      const res = await fetch(
        `${process.env.GATEWAY_URL}/api/ai/generate/cv/${encodeURIComponent(
          resolvedParams.taskId,
        )}/status`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );

      const contentType = res.headers.get("content-type") ?? "";
      const text = await res.text();

      if (contentType.includes("application/json")) {
        return NextResponse.json(JSON.parse(text), { status: res.status });
      }
      return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": contentType || "text/plain" },
      });
    } catch (err: any) {
      console.error("AI status error:", err);
      return NextResponse.json(
        { message: err?.message ?? "Unknown error" },
        { status: 500 },
      );
    }
  },
);
