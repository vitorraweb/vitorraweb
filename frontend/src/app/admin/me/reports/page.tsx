"use client";

import { PageHeader } from "@/components/admin/admin-ui";
import StaffReports from "@/app/staff/reports/page";

export default function Page() {
  return (
    <div>
      <PageHeader title="My reports" subtitle="Your monthly report, and your team's reports to review." />
      <div className="mt-5"><StaffReports /></div>
    </div>
  );
}
