import { PlaceholderPage } from "@/src/components/placeholder-page";
import { requireSession } from "@/src/lib/auth-session";

export default async function NotePage() {
  await requireSession();

  return <PlaceholderPage title="Note" description="Note detail page placeholder." />;
}
