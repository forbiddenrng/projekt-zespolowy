import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";
import { APIClient } from "@/app/lib/apiClient";
import { APIError } from "@/app/lib/errors";

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


export enum APIParams {
  abilities = "abilities",
  education = "education",
  work = "work-experiences",
  certificates = "certificates",
  languages = "languages",
  links = "links"
}

export const PUT = auth0.withApiAuthRequired(
  async (req: Request): Promise<Response> => {
    try {
      const accessTokenResp = await auth0.getAccessToken({
        audience: process.env.AUTH0_AUDIENCE,
      });

      const body = await req.json();
      const url = new URL(req.url);
      const resource= url.searchParams.get("resource") as keyof typeof APIParams;
      
      if (!APIParams[resource]){
        return NextResponse.json({
          message: "Invalid resource parameter"
        }, {status: 400});
      }

      const token =
        typeof accessTokenResp === "string"
          ? accessTokenResp
          : (accessTokenResp as any)?.token ?? null;

      const apiClient = new APIClient();
      const response = await apiClient.updateProfile(APIParams[resource], token, body);

      return NextResponse.json(response.data, {status: response.status})

      
    } catch (err: any) {

      if (err instanceof APIError){
        return NextResponse.json(
          {message: err.userMessage, details: err.details},
          {status: err.statusCode || 500}
        )
      }
      console.error("Unexpected error: ", err);
      return NextResponse.json(
        { message: "An unexpected error occurred. Please try again" },
        { status: 500 }
      );
    }
  }
);

export const PATCH = auth0.withApiAuthRequired(
  async (req: Request): Promise<Response> => {
    try {
      const accessTokenResp = await auth0.getAccessToken({
        audience: process.env.AUTH0_AUDIENCE,
      });

      const body = await req.json();

      const token =
        typeof accessTokenResp === "string"
          ? accessTokenResp
          : (accessTokenResp as any)?.token ?? null;

      const apiClient = new APIClient();
      const response = await apiClient.updateUserInfo(token, body);

      return NextResponse.json(response.data, {status: response.status})

      
    } catch (err: any) {
        if (err instanceof APIError){
          return NextResponse.json(
            {message: err.userMessage, details: err.details},
            {status: err.statusCode || 500}
          )
        }
        console.error("Unexpected error: ", err);
        return NextResponse.json(
          { message: "An unexpected error occurred. Please try again" },
          { status: 500 }
        );
    }
  }
);
