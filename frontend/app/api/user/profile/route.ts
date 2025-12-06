import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";
import { APIClient } from "@/app/lib/apiClient";

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


enum APIParams {
  abilities = "abilities",
  education = "education",
  work = "work-experiences",
  certificates = "certificates",
  languages = "languages"
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

      console.log(body)
      console.log(resource)
      
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
      const resposne = await apiClient.updateProfile(APIParams[resource], token, body);

      return NextResponse.json(resposne.data, {status: resposne.status})

      
    } catch (err: any) {
      return NextResponse.json(
        { message: err?.message ?? "Unknown error" },
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
      // const url = new URL(req.url);
      // const resource = url.searchParams.get("resource");
      
      // if (!resource){
      //   return NextResponse.json({
      //     message: "resource params required"
      //   }, {status: 500});
      // }

      const token =
        typeof accessTokenResp === "string"
          ? accessTokenResp
          : (accessTokenResp as any)?.token ?? null;

      const apiClient = new APIClient();
      const resposne = await apiClient.updateUserInfo(token, body);

      return NextResponse.json(resposne.data, {status: resposne.status})

      
    } catch (err: any) {
      return NextResponse.json(
        { message: err?.message ?? "Unknown error" },
        { status: 500 }
      );
    }
  }
);
