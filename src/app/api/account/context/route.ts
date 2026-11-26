import { NextResponse } from "next/server";
import { getCurrentBusinessSummary } from "@/lib/auth/server";

export async function GET() {
  const context = await getCurrentBusinessSummary();
  if (!context) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(context, {
    headers: { "Cache-Control": "no-store" },
  });
}
