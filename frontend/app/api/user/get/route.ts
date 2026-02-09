import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";
import { APIClient } from "@/app/lib/apiClient";
import { APIError } from "@/app/lib/errors";

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

    const url = new URL(req.url);
    const routeParam = url.searchParams.get("resource") || "all";
    // resource = all | abilities | certificates | education | languages | links | work
    // default param is "all"

    const params = new URLSearchParams();
    params.append(routeParam, "true");

    const apiClient = new APIClient();
    const response = await apiClient.getUser(token, params);

    return NextResponse.json(response?.data, { status: response?.status });
  } catch (error: any) {
    if (error instanceof APIError) {
      return NextResponse.json(
        {
          detail: error.userMessage,
          details: error.details,
        },
        { status: error.statusCode || 500 },
      );
    }

    console.error("Unexpected user fetch error:", error);
    return NextResponse.json(
      { detail: "An unexpected error occurred. Please try again" },
      { status: 500 },
    );
  }
});
