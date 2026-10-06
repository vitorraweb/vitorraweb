import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: React.ReactNode;
  /** Direction the element travels in from. Default: "up" */
  direction?: Direction;
  /** Kept for API compatibility; scroll-driven reveals have no time delay. */
  delay?: number;
  /** Animation distance in px. Default: 18 */
  distance?: number;
  /** Render as a different element. Default: "div" */
  as?: "div" | "section" | "li" | "span";
  className?: string;
  /** Kept for API compatibility; the native reveal always plays once. */
  once?: boolean;
}

/**
 * Scroll reveal — visible by default.
 *
 * The previous version rendered its children at opacity 0 until React hydrated
 * and an IntersectionObserver fired. On a slow phone that left whole sections
 * blank, and a screen reader or a visitor with JavaScript off saw nothing at
 * all. This version is a plain element: the content is in the page and visible
 * from the first byte. Where the browser supports scroll-driven animation the
 * `.q-reveal` class (globals.css) adds a gentle entrance; elsewhere, and under
 * prefers-reduced-motion, it simply shows. No JavaScript, no hydration cost.
 */
export function Reveal({
  children,
  direction = "up",
  distance = 18,
  as = "div",
  className,
}: RevealProps) {
  const [x, y] = (() => {
    switch (direction) {
      case "up": return ["0px", `${distance}px`];
      case "down": return ["0px", `-${distance}px`];
      case "left": return [`${distance}px`, "0px"];
      case "right": return [`-${distance}px`, "0px"];
      default: return ["0px", "0px"];
    }
  })();

  const Component = as as React.ElementType;

  return (
    <Component
      className={cn("q-reveal", className)}
      style={{ "--q-reveal-x": x, "--q-reveal-y": y } as React.CSSProperties}
    >
      {children}
    </Component>
  );
}
