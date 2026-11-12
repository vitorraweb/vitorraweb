import DocumentEditor from "@/components/admin/DocumentEditor";

type Params = { business?: string; name?: string; email?: string; phone?: string; address?: string };

/* "Create quotation" on a prospect row arrives with the customer's details in
   the address, so the form opens already filled in. */
export default async function NewQuotationPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { business, name, email, phone, address } = await searchParams;
  return (
    <DocumentEditor
      type="quotation"
      initialBusiness={business === "fet" ? "fet" : "coffee"}
      initialCustomer={{ name, email, phone, address }}
    />
  );
}
