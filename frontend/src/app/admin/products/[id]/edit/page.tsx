import ProductEditor from "@/components/admin/ProductEditor";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditor productId={Number(id)} />;
}
