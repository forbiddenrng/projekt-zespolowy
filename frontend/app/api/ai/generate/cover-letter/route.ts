import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 120;

export const POST = auth0.withApiAuthRequired(async (req: Request) => {
  try {
    const accessTokenResp = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
    });

    const token =
      typeof accessTokenResp === "string"
        ? accessTokenResp
        : ((accessTokenResp as any)?.token ?? null);

    const body = await req.json();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const res = await fetch(
        `${process.env.GATEWAY_URL}/api/ai/generate/cover-letter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        return NextResponse.json(data, { status: res.status });
      }

      return NextResponse.json(data);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { detail: "Request timeout - generation is taking too long" },
          { status: 504 },
        );
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error("Cover letter generation API error:", error);
    return NextResponse.json(
      { detail: error.message || "Internal server error" },
      { status: 500 },
    );
  }
});
