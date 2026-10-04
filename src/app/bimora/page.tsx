"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppProvider } from "@/components/app/store";
import { AppShell } from "@/components/app/AppShell";

function App() {
  const params = useSearchParams();
  return (
    <AppProvider startWithVoice={params.get("talk") === "1"}>
      <AppShell />
    </AppProvider>
  );
}

export default function BimoraPage() {
  return <Suspense fallback={<div className="min-h-dvh bg-canvas" />}><App /></Suspense>;
}
