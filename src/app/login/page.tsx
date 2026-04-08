import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-muted p-8 text-center">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
