/* Line drawings of the four vehicle classes the FET tiers fit, drawn on one
   80 × 40 grid with one stroke weight so they read as a set. Side views, the
   ground line shared, so the jump in size from car to heavy truck is visible
   at a glance. currentColor, so they follow the text colour around them. */

const PATHS: Record<string, React.ReactNode> = {
  // Saloon car
  car: (
    <>
      <path d="M14 30h-4v-6l5-2 7-7h20l9 7 9 2v6h-4" />
      <path d="M25 30h22" />
      <path d="M24 16l-4 6h31l-8-6z" />
      <circle cx="19.5" cy="30" r="4" /><circle cx="51.5" cy="30" r="4" />
    </>
  ),
  // SUV / van
  suv: (
    <>
      <path d="M12 30H7v-9l4-3 5-8h33l9 8 7 2v10h-4" />
      <path d="M24 30h25" />
      <path d="M19 12l-4 7h40l-8-7zM34 12v7" />
      <circle cx="18" cy="30" r="4.5" /><circle cx="53.5" cy="30" r="4.5" />
    </>
  ),
  // Light truck
  lighttruck: (
    <>
      <path d="M4 30V9h40v21" />
      <path d="M44 15h14l8 9v6h-4" />
      <path d="M49 15v9h17" />
      <path d="M44 30h6M27 30h-1M4 30h4" />
      <circle cx="13" cy="30" r="4.5" /><circle cx="21.5" cy="30" r="4.5" /><circle cx="55" cy="30" r="4.5" />
    </>
  ),
  // Heavy truck (tractor and trailer)
  heavytruck: (
    <>
      <path d="M1 28V5h50v23" />
      <path d="M51 11h14l9 9v8h-3" />
      <path d="M56 11v9h18" />
      <path d="M1 28h4M46 28h12" />
      <circle cx="10" cy="29" r="4" /><circle cx="19" cy="29" r="4" /><circle cx="39" cy="29" r="4" /><circle cx="64" cy="29" r="4" />
    </>
  ),
};

export function VehicleIcon({ kind, className }: { kind: "car" | "suv" | "lighttruck" | "heavytruck"; className?: string }) {
  return (
    <svg viewBox="0 0 80 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {PATHS[kind]}
      <path d="M0 35.5h80" strokeOpacity="0.35" />
    </svg>
  );
}
