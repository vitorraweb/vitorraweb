import FetTrialWorkspace from "@/components/admin/FetTrialWorkspace";

export default async function FetTrialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <FetTrialWorkspace trialId={Number(id)} />;
}
