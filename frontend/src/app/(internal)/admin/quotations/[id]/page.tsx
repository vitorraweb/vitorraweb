import DocumentEditor from "@/components/admin/DocumentEditor";

export default async function QuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentEditor key={id} type="quotation" id={Number(id)} />;
}
