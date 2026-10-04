"use client";
import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

export function PageView({ event }: { event: AnalyticsEvent }) {
  useEffect(() => { track(event); }, [event]);
  return null;
}
