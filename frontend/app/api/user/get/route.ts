import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";
// import { jwtDecode } from "jwt-decode";

export const dynamic = "force-dynamic";
export const fetchCashe = "force-no-store";

export const GET = auth0.withApiAuthRequired(async (req: Request) => {
  try {
    console.log(">>> /api/user/get HIT");

    const session = await auth0.getSession();
    console.log("SESSION:", session ? "OK" : "NULL");

    const accessTokenResp = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
    });

    const token =
      typeof accessTokenResp === "string"
        ? accessTokenResp
        : (accessTokenResp as any)?.token ?? null;

    // const decoded: any = jwtDecode(token);
    // const userID = encodeURIComponent(decoded.sub);

    const params = new URLSearchParams();
    params.append("all", "true");

    const url = `${
      process.env.GATEWAY_URL
    }/users/me?${params.toString()}`;
    const gatewayRes = await fetch(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const contentType = gatewayRes.headers.get("content-type") ?? "";
    const text = await gatewayRes.text();

    console.log("GATEWAY RESPONSE:", gatewayRes.status, text);

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
    console.error("USER PROFILE GET ERROR:", err);
    return NextResponse.json(
      { message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
});
