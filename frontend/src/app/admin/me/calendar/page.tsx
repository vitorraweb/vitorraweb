"use client";

import { PageHeader } from "@/components/admin/admin-ui";
import StaffCalendar from "@/app/staff/calendar/page";

export default function Page() {
  return (
    <div>
      <PageHeader title="Team calendar" subtitle="Who in your department is away, with public holidays and company events." />
      <div className="mt-5"><StaffCalendar /></div>
    </div>
  );
}
