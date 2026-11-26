import Link from "next/link";
import { AuthPage } from "@/components/auth/auth-page";
import { LoginForm } from "@/components/auth/auth-forms";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; passwordReset?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthPage
      title="Welcome back"
      description="Log in to continue to your business workspace."
    >
      {params.passwordReset === "1" && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Your password has been updated. You can now log in.
        </p>
      )}
      {params.error === "auth-callback" && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
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
