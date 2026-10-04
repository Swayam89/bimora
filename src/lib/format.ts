export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const daysUntil = (iso: string) => Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 86400000));
export const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
