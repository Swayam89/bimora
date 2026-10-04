import Link from "next/link";
import { cx } from "@/lib/format";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet" | "ghost" | "dark";
type Size = "md" | "lg" | "sm";

const base = "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50";
const variants: Record<Variant, string> = {
  primary: "bg-action text-white hover:bg-action-hover",
  secondary: "border border-ink/15 bg-canvas text-ink hover:border-ink/40",
  quiet: "bg-paper text-ink hover:bg-[#EFEDE7]",
  ghost: "text-ink hover:bg-paper",
  dark: "bg-ink text-white hover:bg-black",
};
const sizes: Record<Size, string> = { sm: "min-h-[40px] px-3.5 text-[0.9rem]", md: "min-h-[48px] px-5 text-[0.98rem]", lg: "min-h-[56px] px-6 text-[1.04rem]" };

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cx(base, variants[variant], sizes[size], extra);
}

export function Button({ variant = "primary", size = "md", className, ...rest }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...rest} />;
}

export function ButtonLink({ href, variant = "primary", size = "md", className, children, onClick }: { href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode; onClick?: () => void }) {
  return <Link href={href} className={buttonClass(variant, size, className)} onClick={onClick}>{children}</Link>;
}
