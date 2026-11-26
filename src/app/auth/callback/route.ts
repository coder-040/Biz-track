import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  if (
    value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }
  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth-callback", request.url));
  }

  const supabase = await createServerSupabaseClient({ setCookies: true });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Supabase auth callback failed.", {
      code: error.code,
      status: error.status,
    });
    return NextResponse.redirect(new URL("/login?error=auth-callback", request.url));
  }

  return NextResponse.redirect(
    new URL(
      safeNextPath(request.nextUrl.searchParams.get("next")),
      request.url,
    ),
  );
}
