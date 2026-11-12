import DocumentEditor from "@/components/admin/DocumentEditor";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentEditor key={id} type="invoice" id={Number(id)} />;
}
