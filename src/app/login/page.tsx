
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AuthPage } from "@/components/auth/auth-page";
import { LoginForm } from "@/components/auth/auth-forms";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface LoginPageProps {
  searchParams: Promise<{
    next?: string;
    passwordReset?: string;
    error?: string;
  }>;
}

async function LoginContent({ searchParams }: LoginPageProps) {
  await connection();

  const params = await searchParams;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthPage
      title="Welcome back"
      description="Log in to continue to your business workspace."
    >
      {params.passwordReset === "1" && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          Your password has been updated. You can now log in.
        </p>
      )}

      {params.error === "auth-callback" && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          That authentication link is invalid or expired. Please try again.
        </p>
      )}

      <LoginForm next={params.next} />

      <p className="mt-4 text-center text-xs text-stone-500">
        By continuing, you agree to keep your business account secure.
      </p>

      <Link href="/register" className="sr-only">
        Create an account
      </Link>
    </AuthPage>
  );
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent {...props} />
    </Suspense>
  );
}
