import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";
import { APIClient } from "@/app/lib/apiClient";
import { APIError } from "@/app/lib/errors";

export const dynamic = "force-dynamic";
export const fetchCashe = "force-no-store";


export const GET = auth0.withApiAuthRequired(async (req: Request) => {
  try {

    const accessTokenResp = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
    });

    const token =
      typeof accessTokenResp === "string"
        ? accessTokenResp
        : (accessTokenResp as any)?.token ?? null;

    const url = new URL(req.url);
    const rotueParam = url.searchParams.get("resource") || "all"; // custom URL search params
    // resource = all | abilities | certificates | education | languages | links | work
    // default param is all

    const params = new URLSearchParams();
    params.append(rotueParam, "true");

    const apiClient = new APIClient();
    const response = await apiClient.getUser(token, params);

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
