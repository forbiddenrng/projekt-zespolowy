import { auth0 } from "@/app/lib/auth0";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = auth0.withApiAuthRequired(
  async (_req: Request, context: { params: Promise<{ taskId: string }> }) => {
    try {
      const params = await context.params;

      const accessTokenResp = await auth0.getAccessToken({
        audience: process.env.AUTH0_AUDIENCE,
      });

      const token =
        typeof accessTokenResp === "string"
          ? accessTokenResp
          : (accessTokenResp as any)?.token ?? null;

      const res = await fetch(
        `${process.env.GATEWAY_URL}/api/ai/cv/${encodeURIComponent(
          params.taskId
        )}/download`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        return new Response(text, {
          status: res.status,
          headers: {
            "Content-Type": res.headers.get("content-type") ?? "text/plain",
          },
        });
      }

      const buf = await res.arrayBuffer();
      return new Response(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="cv-${params.taskId}.pdf"`,
        },
      });
    } catch (err: any) {
      console.error("AI download error:", err);
      return new Response(
        JSON.stringify({ message: err?.message ?? "Unknown error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
);
