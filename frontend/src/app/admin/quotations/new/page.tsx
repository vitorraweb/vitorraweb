import DocumentEditor from "@/components/admin/DocumentEditor";

export default async function NewQuotationPage({ searchParams }: { searchParams: Promise<{ business?: string }> }) {
  const { business } = await searchParams;
  return <DocumentEditor type="quotation" initialBusiness={business === "fet" ? "fet" : "coffee"} />;
}
