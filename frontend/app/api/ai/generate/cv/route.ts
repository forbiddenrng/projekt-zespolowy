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
        : (accessTokenResp as any)?.token ?? null;

    const body = await req.json();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const res = await fetch(`${process.env.GATEWAY_URL}/api/ai/generate/cv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get("content-type") ?? "";
      const text = await res.text();

      if (contentType.includes("application/json")) {
        return NextResponse.json(JSON.parse(text), { status: res.status });
      }
      return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": contentType || "text/plain" },
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr.name === "AbortError") {
        return NextResponse.json(
          { message: "Request timeout - generation is taking too long" },
          { status: 504 }
        );
      }
      throw fetchErr;
    }
  } catch (err: any) {
    console.error("AI generate CV error:", err);
    return NextResponse.json(
      { message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
});
