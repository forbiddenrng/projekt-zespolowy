import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";
import { APIClient } from "@/app/lib/apiClient";
import { APIError } from "@/app/lib/errors";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export enum APIParams {
  abilities = "abilities",
  education = "education",
  work = "work-experiences",
  certificates = "certificates",
  languages = "languages",
  links = "links",
}

export const GET = auth0.withApiAuthRequired(
  async (_req: Request): Promise<Response> => {
    try {
      const accessTokenResponse = await auth0.getAccessToken({
        audience: process.env.AUTH0_AUDIENCE,
      });

      const token =
        typeof accessTokenResponse === "string"
          ? accessTokenResponse
          : ((accessTokenResponse as any)?.token ?? null);

      const backendUrl = `${process.env.GATEWAY_URL}/users/profile`;
      const response = await fetch(backendUrl, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: "application/json",
        },
      });

      const contentType = response.headers.get("content-type") ?? "";
      const responseText = await response.text();

      if (contentType.includes("application/json")) {
        try {
          const data = JSON.parse(responseText);
          return NextResponse.json(data, { status: response.status });
        } catch {
          // Fallback if parsing fails
        }
      }

      return new NextResponse(responseText, {
        status: response.status,
        headers: { "Content-Type": contentType || "text/plain" },
      });
    } catch (error: any) {
      console.error("Profile fetch API error:", error);
      return NextResponse.json(
        { detail: error?.message ?? "Internal server error" },
        { status: 500 },
      );
    }
  },
);

export const PUT = auth0.withApiAuthRequired(
  async (req: Request): Promise<Response> => {
    try {
      const accessTokenResponse = await auth0.getAccessToken({
        audience: process.env.AUTH0_AUDIENCE,
      });

      const body = await req.json();
      const url = new URL(req.url);
      const resource = url.searchParams.get(
        "resource",
      ) as keyof typeof APIParams;

      if (!APIParams[resource]) {
        return NextResponse.json(
          { detail: "Invalid resource parameter" },
          { status: 400 },
        );
      }

      const token =
        typeof accessTokenResponse === "string"
          ? accessTokenResponse
          : ((accessTokenResponse as any)?.token ?? null);

      const apiClient = new APIClient();
      const response = await apiClient.updateProfile(
        APIParams[resource],
        token,
        body,
      );

      return NextResponse.json(response.data, { status: response.status });
    } catch (error: any) {
      if (error instanceof APIError) {
        return NextResponse.json(
          { detail: error.userMessage, details: error.details },
          { status: error.statusCode || 500 },
        );
      }
      console.error("Profile update (PUT) API error:", error);
      return NextResponse.json(
        { detail: "An unexpected error occurred. Please try again" },
        { status: 500 },
      );
    }
  },
);

export const PATCH = auth0.withApiAuthRequired(
  async (req: Request): Promise<Response> => {
    try {
      const accessTokenResponse = await auth0.getAccessToken({
        audience: process.env.AUTH0_AUDIENCE,
      });

      const body = await req.json();

      const token =
        typeof accessTokenResponse === "string"
          ? accessTokenResponse
          : ((accessTokenResponse as any)?.token ?? null);

      const apiClient = new APIClient();
      const response = await apiClient.updateUserInfo(token, body);

      return NextResponse.json(response.data, { status: response.status });
    } catch (error: any) {
      if (error instanceof APIError) {
        return NextResponse.json(
          { detail: error.userMessage, details: error.details },
          { status: error.statusCode || 500 },
        );
      }
      console.error("User info update (PATCH) API error:", error);
      return NextResponse.json(
        { detail: "An unexpected error occurred. Please try again" },
        { status: 500 },
      );
    }
  },
);
