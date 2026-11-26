import { AuthPage } from "@/components/auth/auth-page";
import { RegistrationForm } from "@/components/auth/auth-forms";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next =
    params.next?.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/dashboard";

  return (
    <AuthPage
      title="Create your account"
      description="Set up your personal account, then add your business."
    >
      <RegistrationForm next={next} />
    </AuthPage>
  );
}
