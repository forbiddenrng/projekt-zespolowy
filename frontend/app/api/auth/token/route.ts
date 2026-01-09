import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";

export const GET = auth0.withApiAuthRequired(async () => {
  try {
    const accessTokenResp = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
    });

    const accessToken =
      typeof accessTokenResp === "string"
        ? accessTokenResp
        : (accessTokenResp as any)?.token ?? null;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token available" },
        { status: 401 }
      );
    }

    return NextResponse.json({ accessToken });
  } catch (error: any) {
    console.error("Token error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get token" },
      { status: 500 }
    );
  }
});
