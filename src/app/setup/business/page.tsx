import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { AuthPage } from "@/components/auth/auth-page";
import { BusinessSetupForm } from "@/components/auth/auth-forms";
import { requireAuthenticatedUser, getCurrentBusinessSummary } from "@/lib/auth/server";

export default async function BusinessSetupPage() {
  await requireAuthenticatedUser();
  const context = await getCurrentBusinessSummary();

  if (context?.memberships.length) {
    redirect(
      context.memberships.length === 1 ? "/dashboard" : "/business/select",
    );
  }

  return (
    <AuthPage
      title="Set up your business"
      description="Add a few details to create your business workspace. You’ll be its Owner."
    >
      <BusinessSetupForm requestId={randomUUID()} />
    </AuthPage>
  );
}
