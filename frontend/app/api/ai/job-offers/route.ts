import { auth0 } from "@/app/lib/auth0";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = auth0.withApiAuthRequired(async (req: Request) => {
  try {
    const accessTokenResponse = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
    });

    const token =
      typeof accessTokenResponse === "string"
        ? accessTokenResponse
        : ((accessTokenResponse as any)?.token ?? null);

    const { searchParams } = new URL(req.url);
    const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "");
    const gatewayUrl = `${baseUrl}/api/jobs?${searchParams.toString()}`;

    const response = await fetch(gatewayUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Jobs fetch API error:", error);
    return NextResponse.json(
      { detail: error.message || "Internal server error" },
      { status: 500 },
    );
  }
});
