import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";

export const GET = auth0.withApiAuthRequired(async () => {
  return NextResponse.json({ ok: true });
});
