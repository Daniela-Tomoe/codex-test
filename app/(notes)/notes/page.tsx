import { PlaceholderPage } from "@/src/components/placeholder-page";
import { requireSession } from "@/src/lib/auth-session";

export default async function NotesPage() {
  await requireSession();

  return <PlaceholderPage title="Notes" description="Notes list placeholder." />;
}
