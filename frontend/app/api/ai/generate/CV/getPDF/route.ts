import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "../../../lib/auth0";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL;

// Download PDF
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
      `${GATEWAY_URL}/api/ai/cv/${task_id}/download`,
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
        { error: errorData.detail || "Failed to download CV" },
        { status: response.status }
      );
    }

    // Forward PDF as a stream
    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=cv_${task_id}.pdf`,
      },
    });
  } catch (error: any) {
    console.error("CV download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
