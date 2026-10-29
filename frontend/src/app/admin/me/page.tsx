"use client";

import { PageHeader } from "@/components/admin/admin-ui";
import StaffDashboard from "@/app/staff/page";

/* My work — the staff portal's self-service, inside the console, on the
   console session. Leadership, Operations and Finance never need the
   separate staff sign-in; employees keep using /staff.                  */
export default function MyWorkHome() {
  return (
    <div>
      <PageHeader title="My work" subtitle="Your own leave, monthly reports, documents and team — the same as the staff portal, without signing in again." />
      <div className="mt-5"><StaffDashboard /></div>
    </div>
  );
}
