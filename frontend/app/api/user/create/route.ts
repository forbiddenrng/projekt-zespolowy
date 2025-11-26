import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    console.log(">>> /api/user/create HIT");

    // pobierz aktualną sesję
    const session = await auth0.getSession();
    console.log("SESSION:", session ? "OK" : "NULL");

    // odczytaj body
    const body = await req.json();
    console.log("BODY RECEIVED:", body);

    // token do gateway (opcjonalnie)
    const accessTokenResp = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
    });

    const token =
      typeof accessTokenResp === "string"
        ? accessTokenResp
        : (accessTokenResp as any)?.token ?? null;

    console.log("TOKEN:", token ? "OK" : "MISSING");

    // fetch do gateway (BEZ /users, bo proxy doda)
    const gatewayRes = await fetch(`${process.env.GATEWAY_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const text = await gatewayRes.text();
    console.log("GATEWAY RESPONSE:", gatewayRes.status, text);

    const contentType = gatewayRes.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      return NextResponse.json(JSON.parse(text), { status: gatewayRes.status });
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
}
