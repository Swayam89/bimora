/**
 * Service registry. To go live with a provider, implement its contract in
 * services/<provider>.ts and return it here when NEXT_PUBLIC_SERVICE_MODE !== "mock".
 * Secrets must stay server-side: real clients should call your own API routes,
 * not vendors directly from the browser.
 */
import type { Services } from "./contracts";
import { mockServices } from "./mock";

const mode = process.env.NEXT_PUBLIC_SERVICE_MODE ?? "mock";

export function getServices(): Services {
  if (mode !== "mock") {
    // Real clients are not built yet. Fall back to mocks rather than fail.
    console.warn("[bimora] Only mock services exist in this build.");
  }
  return mockServices;
}

export const services = getServices();
export type { Services } from "./contracts";
