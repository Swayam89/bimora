import Link from "next/link";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-baseline gap-2 rounded-md text-ink">
      <span className="font-display text-[1.6rem] font-semibold leading-none tracking-[-0.02em]">
        bimora<span className="text-action">.</span>
      </span>
      {!compact && <span className="text-[0.8rem] font-medium text-soft">by Ditto</span>}
    </Link>
  );
}
