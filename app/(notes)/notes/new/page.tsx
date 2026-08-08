import { PlaceholderPage } from "@/src/components/placeholder-page";
import { requireSession } from "@/src/lib/auth-session";

export default async function NewNotePage() {
  await requireSession();

  return <PlaceholderPage title="New note" description="New note page placeholder." />;
}
