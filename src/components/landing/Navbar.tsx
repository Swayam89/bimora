"use client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { cx } from "@/lib/format";
import { track } from "@/lib/analytics";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#what", label: "What Bimora does" },
  { href: "#why", label: "Why Bimora" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className={cx("sticky top-0 z-40 border-b transition-colors duration-200", scrolled || open ? "border-line bg-canvas/95 backdrop-blur" : "border-transparent bg-canvas")}>
      <div className="page-x flex h-[68px] items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => <a key={l.href} href={l.href} className="text-[0.95rem] font-medium text-ink hover:text-action">{l.label}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="/start?intent=cover" size="sm" className="hidden sm:inline-flex" onClick={() => track("hero_cta_clicked", { cta: "get_started", location: "nav" })}>Get started</ButtonLink>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-control text-ink hover:bg-paper lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
            {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <div id="mobile-nav" className="fixed inset-x-0 bottom-0 top-[68px] z-40 overflow-y-auto bg-canvas lg:hidden">
          <nav aria-label="Mobile" className="page-x flex flex-col py-4">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-line py-4 font-display text-[1.6rem] text-ink">{l.label}</a>
            ))}
            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink href="/start?intent=cover" size="lg" onClick={() => setOpen(false)}>Find My Best Coverage</ButtonLink>
              <ButtonLink href="/bimora?talk=1" size="lg" variant="secondary" onClick={() => setOpen(false)}>Talk to Bimora</ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
