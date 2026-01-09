import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "../../../lib/auth0";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL;

console.log("GATEWAY_URL configured as:", GATEWAY_URL);

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session?.accessToken) {
      console.log("No access token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { job_offer } = body;

    const targetUrl = `${GATEWAY_URL}/api/ai/generate/cv`;
    console.log("📤 Sending to:", targetUrl);
    console.log("🎯 Body:", { job_offer });
    console.log("🔑 Token:", session.accessToken);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ job_offer: job_offer || "" }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    if (!response.ok) {
      const text = await response.text();
      console.error("Error response:", text);

      try {
        const errorData = JSON.parse(text);
        return NextResponse.json(
          { error: errorData.detail || "Failed to generate CV" },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          {
            error: `Server error: ${response.status} - ${text.substring(
              0,
              100
            )}`,
          },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("CV generation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
