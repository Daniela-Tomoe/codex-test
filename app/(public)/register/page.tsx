import type { Metadata } from "next";

import { AuthForm } from "@/src/components/auth-form";
import { redirectIfAuthenticated } from "@/src/lib/auth-session";

export const metadata: Metadata = {
  title: "Register | TinyNotes",
};

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return <AuthForm mode="register" />;
}
