import { auth0 } from "@/app/lib/auth0";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = auth0.withApiAuthRequired(async (req: Request) => {
  try {
    const accessTokenResp = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
    });

    const token =
      typeof accessTokenResp === "string"
        ? accessTokenResp
        : ((accessTokenResp as any)?.token ?? null);

    const { searchParams } = new URL(req.url);
    const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "");
    const gatewayUrl = `${baseUrl}/api/jobs?${searchParams.toString()}`;

    // --- LOG START ---
    console.log("\n**************************************************");
    console.log("1. NEXT.JS ROUTE HANDLER LOG");
    console.log("TARGET GATEWAY URL:", gatewayUrl);
    console.log("HAS TOKEN:", !!token);
    console.log("**************************************************\n");
    // --- LOG END ---

    const res = await fetch(gatewayUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("DEBUG: Route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
