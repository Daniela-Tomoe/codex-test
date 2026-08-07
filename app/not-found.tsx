import { PageShell } from "@/src/components/page-shell";
import { PlaceholderPage } from "@/src/components/placeholder-page";

export default function NotFoundPage() {
  return (
    <PageShell sectionLabel="TinyNotes">
      <PlaceholderPage title="Not found" description="The requested page could not be found." />
    </PageShell>
  );
}
