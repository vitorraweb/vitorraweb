import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Magnetic } from "@/components/motion/Magnetic";
import { cn } from "@/lib/utils";

/* ─── Circle call to action ───────────────────────────────────────────────────
   An outline disc with the label inside. On hover a gold fill rises from the
   bottom and the disc leans toward the pointer (Magnetic). Used where one
   action matters most in a section — never more than one per section.
   Styles: .q-circle in globals.css (BOLD LAYER).                             */

export function CircleLink({
  href,
  children,
  onInk = false,
  size = "md",
  external = false,
  className,
}: {
  href: string;
  children: React.ReactNode;
  onInk?: boolean;
  size?: "sm" | "md" | "lg";
  external?: boolean;
  className?: string;
}) {
  const style = { "--size": { sm: "7.5rem", md: "9.5rem", lg: "12rem" }[size] } as React.CSSProperties;
  const inner = (
    <>
      <span className="t-small font-medium max-w-[6.5rem]">{children}</span>
      <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
    </>
  );
  const props = { className: cn("q-circle", className), style, "data-on-ink": onInk ? "" : undefined };

  return (
    <Magnetic strength={0.18}>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{inner}</a>
      ) : (
        <Link href={href} {...props}>{inner}</Link>
      )}
    </Magnetic>
  );
}
