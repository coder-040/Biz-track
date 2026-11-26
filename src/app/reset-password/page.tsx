import { AuthPage } from "@/components/auth/auth-page";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export default function ResetPasswordPage() {
  return (
    <AuthPage
      title="Choose a new password"
      description="Use a strong password that you have not used before."
    >
      <ResetPasswordForm />
    </AuthPage>
  );
}
