import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = auth0.withApiAuthRequired(async (req: Request) => {
  try {
    // TOKEN DO GATEWAY
    const accessTokenResp = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
    });

    const token =
      typeof accessTokenResp === "string"
        ? accessTokenResp
        : (accessTokenResp as any)?.token ?? null;

    // FORWARD DO GATEWAY (GET)
    const gatewayRes = await fetch(
      `${process.env.GATEWAY_URL}/users/languages/all`,
      {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const contentType = gatewayRes.headers.get("content-type") ?? "";
    const text = await gatewayRes.text();

    // JSON → JSON
    if (contentType.includes("application/json")) {
      return NextResponse.json(JSON.parse(text), {
        status: gatewayRes.status,
      });
    }

    // inne typy → tekst
    return new NextResponse(text, {
      status: gatewayRes.status,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  } catch (err: any) {
    console.error("LANGUAGE GET ERROR:", err);
    return NextResponse.json(
      { message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
});
