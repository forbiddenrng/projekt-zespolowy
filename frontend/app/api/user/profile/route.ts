import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";

export const GET = auth0.withApiAuthRequired(
  async (_req: Request): Promise<Response> => {
    try {
      const accessTokenResp = await auth0.getAccessToken({
        audience: process.env.AUTH0_AUDIENCE,
      });

      const token =
        typeof accessTokenResp === "string"
          ? accessTokenResp
          : (accessTokenResp as any)?.token ?? null;

      const backendUrl = `${process.env.GATEWAY_URL}/users/profile`;
      const gatewayRes = await fetch(backendUrl, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: "application/json",
        },
      });

      const contentType = gatewayRes.headers.get("content-type") ?? "";
      const text = await gatewayRes.text();

      if (contentType.includes("application/json")) {
        return NextResponse.json(JSON.parse(text), {
          status: gatewayRes.status,
        });
      } else {
        return new NextResponse(text, {
          status: gatewayRes.status,
          headers: { "Content-Type": contentType || "text/plain" },
        });
      }
    } catch (err: any) {
      return NextResponse.json(
        { message: err?.message ?? "Unknown error" },
        { status: 500 }
      );
    }
  }
);
