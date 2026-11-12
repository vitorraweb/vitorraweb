import ContractEditor from "@/components/admin/ContractEditor";

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContractEditor key={id} id={Number(id)} />;
}
