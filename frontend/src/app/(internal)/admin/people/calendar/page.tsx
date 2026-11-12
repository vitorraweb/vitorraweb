"use client";

import { apiAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/admin-ui";
import { LeaveCalendar } from "@/components/people/LeaveCalendar";

/* People → Leave calendar: everyone's leave this month, by type, including requests still awaiting signatures. */
export default function PeopleCalendar() {
  return (
    <div className="pb-12">
      <PageHeader title="Leave calendar" subtitle="Everyone's leave by day — approved and awaiting signatures — with public holidays and company events." />
      <div className="mt-5"><LeaveCalendar fetcher={apiAdmin} endpoint="/admin/people/calendar" showTypes /></div>
    </div>
  );
}
