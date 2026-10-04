import type { Metadata } from "next";
export const metadata: Metadata = { title: "Bimora", robots: { index: false } };
export default function L({ children }: { children: React.ReactNode }) { return children; }
