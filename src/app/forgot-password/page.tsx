import { AuthPage } from "@/components/auth/auth-page";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <AuthPage
      title="Reset your password"
      description="Enter your account email and we’ll send a reset link if it’s registered."
    >
      <ForgotPasswordForm />
    </AuthPage>
  );
}
