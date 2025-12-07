import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";
import { APIClient } from "@/app/lib/apiClient";
import { APIError } from "@/app/lib/errors";

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

    const apiClient = new APIClient();
    const response = await apiClient.getAllLanguages(token);

    return NextResponse.json(response?.data, {status: response?.status})

  } catch (err: any) {
    if (err instanceof APIError){
      return NextResponse.json(
        {message: err.userMessage, details: err.details},
        {status: err.statusCode || 500}
      )
    }
    console.error("Unexpected error: ", err);
    return NextResponse.json(
      { message: "An unexpected error occured. Please try again" },
      { status: 500 }
    );
  }
});
