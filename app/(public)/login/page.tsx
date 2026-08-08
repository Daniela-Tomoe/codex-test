import type { Metadata } from "next";

import { AuthForm } from "@/src/components/auth-form";
import { redirectIfAuthenticated } from "@/src/lib/auth-session";

export const metadata: Metadata = {
  title: "Login | TinyNotes",
};

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return <AuthForm mode="login" />;
}
