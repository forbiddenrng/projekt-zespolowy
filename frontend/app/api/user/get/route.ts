import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";
import { APIClient } from "@/app/lib/apiClient";

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
    const rotueParam = url.searchParams.get("type") || "all"; // custom URL search params type=resource
    // resource = all | abilities | certificates | education | languages | links | work
    // default param is all

    const params = new URLSearchParams();
    params.append(rotueParam, "true");

    const apiClient = new APIClient();
    const response = await apiClient.getUser(token, params);

    // console.log(response.data)

    // const gatewayRes = await fetch(url, {
    //   method: "GET",
    //   headers: {
    //     ...(token ? { Authorization: `Bearer ${token}` } : {}),
    //   },
    // });

    // const contentType = gatewayRes.headers.get("content-type") ?? "";
    // const text = await gatewayRes.text();

    // JSON → JSON
    // if (contentType.includes("application/json")) {
    //   return NextResponse.json(JSON.parse(text), {
    //     status: gatewayRes.status,
    //   });
    // }

    // const data = response.data
    console.log(response.data.user_languages)
    return NextResponse.json(response?.data, {status: response?.status})

    // inne typy → tekst
    // return new NextResponse(text, {
    //   status: response?.status,
    //   headers: { "Content-Type": contentType || "text/plain" },
    // });
  } catch (err: any) {
    console.error("USER PROFILE GET ERROR:", err);
    return NextResponse.json(
      { message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
});
