/** Local persistence of the onboarding profile. Stays on this device only. */
import { EMPTY_PROFILE, type Profile } from "@/lib/agent/profile";

const KEY = "bimora.profile.v1";

export function loadProfile(): Profile | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...EMPTY_PROFILE, ...JSON.parse(raw) } : null;
  } catch { return null; }
}
export function saveProfile(p: Profile) {
  try { window.localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable: continue in memory */ }
}
export function clearProfile() {
  try { window.localStorage.removeItem(KEY); } catch { /* noop */ }
}
