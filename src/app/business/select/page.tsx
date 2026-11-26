import { redirect } from "next/navigation";
import { AuthPage } from "@/components/auth/auth-page";
import { Button } from "@/components/ui/button";
import { requireAuthenticatedUser, getCurrentBusinessSummary } from "@/lib/auth/server";
import { selectBusiness } from "@/app/auth/actions";

export default async function BusinessSelectPage() {
  await requireAuthenticatedUser();
  const context = await getCurrentBusinessSummary();

  if (!context?.memberships.length) redirect("/setup/business");
  if (context.memberships.length === 1) redirect("/dashboard");

  return (
    <AuthPage
      title="Choose a business"
      description="Select which authorized business workspace to open."
    >
      <div className="space-y-3">
        {context.memberships.map((business) => (
          <form key={business.id} action={selectBusiness}>
            <input type="hidden" name="businessId" value={business.id} />
            <Button
              type="submit"
              variant="outline"
              className="h-auto w-full justify-between rounded-xl border-stone-200 px-4 py-3 text-left"
            >
              <span>
                <span className="block font-semibold text-stone-900">
                  {business.name}
                </span>
                <span className="mt-0.5 block text-xs capitalize text-stone-500">
                  {business.role}
                </span>
              </span>
              <span aria-hidden="true">→</span>
            </Button>
          </form>
        ))}
      </div>
    </AuthPage>
  );
}
