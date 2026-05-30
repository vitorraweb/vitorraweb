import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";
import type { VariantProps } from "class-variance-authority";

interface LinkButtonProps extends VariantProps<typeof buttonVariants> {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  external?: boolean;
}

export function LinkButton({
  href,
  className,
  variant,
  size,
  children,
  onClick,
  external = false,
}: LinkButtonProps) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant, size }), className)}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
