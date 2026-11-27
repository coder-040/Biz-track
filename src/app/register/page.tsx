
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AuthPage } from "@/components/auth/auth-page";
import { RegistrationForm } from "@/components/auth/auth-forms";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface RegisterPageProps {
  searchParams: Promise<{ next?: string }>;
}

async function RegisterContent({ searchParams }: RegisterPageProps) {
  await connection();

  const params = await searchParams;

  const next =
    params.next?.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/dashboard";

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthPage
      title="Create your account"
      description="Set up your personal account, then add your business."
    >
      <RegistrationForm next={next} />
    </AuthPage>
  );
}

export default function RegisterPage(props: RegisterPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterContent {...props} />
    </Suspense>
  );
}
