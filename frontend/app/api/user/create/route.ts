import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const POST = auth0.withApiAuthRequired(async (req: Request) => {
  try {
    // pobierz aktualną sesję
    const session = await auth0.getSession();

    const body = await req.json();

    // TOKEN DO GATEWAY
    const accessTokenResp = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
    });

    const token =
      typeof accessTokenResp === "string"
        ? accessTokenResp
        : (accessTokenResp as any)?.token ?? null;

    // FORWARD DO GATEWAY
    const gatewayRes = await fetch(`${process.env.GATEWAY_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const contentType = gatewayRes.headers.get("content-type") ?? "";
    const text = await gatewayRes.text();

    if (contentType.includes("application/json")) {
      return NextResponse.json(JSON.parse(text), {
        status: gatewayRes.status,
      });
    }

    return new NextResponse(text, {
      status: gatewayRes.status,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  } catch (err: any) {
    console.error("CREATE ERROR:", err);
    return NextResponse.json(
      { message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
});
