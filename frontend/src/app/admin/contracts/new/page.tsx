import ContractEditor from "@/components/admin/ContractEditor";

/* "Create contract" on a quotation arrives with ?quotation=, so the client's
   details and the price are filled in from it. */
export default async function NewContractPage({ searchParams }: { searchParams: Promise<{ quotation?: string }> }) {
  const { quotation } = await searchParams;
  return <ContractEditor quotationId={quotation ? Number(quotation) || undefined : undefined} />;
}
