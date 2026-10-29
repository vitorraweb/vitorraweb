"use client";

import { PageHeader } from "@/components/admin/admin-ui";
import StaffTeam from "@/app/staff/team/page";

export default function Page() {
  return (
    <div>
      <PageHeader title="My team" subtitle="The people who report to you." />
      <div className="mt-5"><StaffTeam /></div>
    </div>
  );
}
