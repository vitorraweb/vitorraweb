"use client";

import { PageHeader } from "@/components/admin/admin-ui";
import StaffLeave from "@/app/staff/leave/page";

export default function Page() {
  return (
    <div>
      <PageHeader title="My leave" subtitle="Apply for leave, see your balance, and sign requests waiting on you." />
      <div className="mt-5"><StaffLeave /></div>
    </div>
  );
}
