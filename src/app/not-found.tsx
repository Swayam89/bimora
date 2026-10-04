import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6 text-center">
      <div><p className="eyebrow">Page not found</p><h1 className="mt-3 font-display text-display-md text-ink">We couldn’t find that page.</h1>
        <Link href="/" className="mt-6 inline-flex min-h-[48px] items-center rounded-control bg-action px-5 font-semibold text-white">Go to home</Link></div>
    </main>
  );
}
