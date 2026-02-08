import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 120;

export const POST = auth0.withApiAuthRequired(async (req: Request) => {
  try {
    const accessTokenResponse = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
    });

    const token =
      typeof accessTokenResponse === "string"
        ? accessTokenResponse
        : ((accessTokenResponse as any)?.token ?? null);

    const body = await req.json();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch(
        `${process.env.GATEWAY_URL}/api/ai/generate/cv`,
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
    console.error("CV generation API error:", error);
    return NextResponse.json(
      { detail: error.message || "Internal server error" },
      { status: 500 },
    );
  }
});
