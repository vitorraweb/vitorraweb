"use client";

import { apiStaff } from "@/lib/staff-auth";
import { LeaveCalendar } from "@/components/people/LeaveCalendar";

/* Who in my department is away, and when — approved leave only, no leave type. */
export default function StaffCalendarPage() {
  return (
    <div className="pb-12">
      <p className="text-sm mb-4" style={{ color: "var(--o-faint)" }}>Approved leave in your department, plus public holidays and company events. Plan your own leave around it.</p>
      <LeaveCalendar fetcher={apiStaff} endpoint="/staff/calendar" />
    </div>
  );
}
