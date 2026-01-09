import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "../../../lib/auth0";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: { task_id: string } }
) {
  try {
    const session = await auth0.getSession();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { task_id } = params;

    const response = await fetch(
      `${GATEWAY_URL}/api/ai/generate/cv/${task_id}/status`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "Failed to get CV status" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("CV status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
