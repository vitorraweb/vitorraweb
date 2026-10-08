import DocumentEditor from "@/components/admin/DocumentEditor";

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ business?: string; kind?: string }> }) {
  const { business, kind } = await searchParams;
  return (
    <DocumentEditor
      type="invoice"
      initialBusiness={business === "fet" ? "fet" : "coffee"}
      initialKind={kind === "commercial" || kind === "final" ? kind : "standard"}
    />
  );
}
