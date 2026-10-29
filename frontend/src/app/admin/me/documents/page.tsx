"use client";

import { PageHeader } from "@/components/admin/admin-ui";
import StaffDocuments from "@/app/staff/documents/page";

export default function Page() {
  return (
    <div>
      <PageHeader title="My documents" subtitle="Your contract and HR files." />
      <div className="mt-5"><StaffDocuments /></div>
    </div>
  );
}
