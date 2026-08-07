import type { Metadata } from "next";

import { AuthForm } from "@/src/components/auth-form";

export const metadata: Metadata = {
  title: "Register | TinyNotes",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
