import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";
import { APIClient } from "@/app/lib/apiClient";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const POST = auth0.withApiAuthRequired(async (req: Request) => {
  try {
    const body = await req.json();

    // TOKEN DO GATEWAY
    const accessTokenResp = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
    });

    const token =
      typeof accessTokenResp === "string"
        ? accessTokenResp
        : (accessTokenResp as any)?.token ?? null;

    const apiClient = new APIClient();
    const response = await apiClient.createProfile(token, body);

    return NextResponse.json(response.data, {status: response.status})

  } catch (err: any) {
    console.error("CREATE ERROR:", err);
    return NextResponse.json(
      { message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
});
