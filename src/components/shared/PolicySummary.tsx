import { AlertTriangle, BedDouble, Clock, FileWarning, Percent, ShieldCheck } from "lucide-react";
import type { Coverage } from "@/lib/types";
import { inr } from "@/lib/format";

export function PolicySummary({ coverage, name, isSample }: { coverage: Coverage; name: string; isSample?: boolean }) {
  const rows = [
    { icon: ShieldCheck, title: "Coverage", tone: "text-ok", items: [coverage.sumInsured ? `Sum insured: ${inr(coverage.sumInsured)} per year` : "Sum insured not found", ...coverage.coveredItems] },
    { icon: Clock, title: "Waiting periods", tone: "text-gap", items: coverage.waitingPeriods.map((w) => `${w.label}: ${w.detail}`) },
    { icon: FileWarning, title: "Exclusions", tone: "text-danger", items: coverage.exclusions },
    { icon: BedDouble, title: "Room restrictions", tone: "text-action-ink", items: [coverage.roomRent ?? "Not stated in the document"] },
    { icon: Percent, title: "Co-payment", tone: "text-action-ink", items: [coverage.coPay ?? "Not stated in the document", ...(coverage.deductible ? [`Deductible: ${coverage.deductible}`] : [])] },
    { icon: AlertTriangle, title: "Important conditions", tone: "text-gap", items: coverage.importantConditions },
  ];
  return (
    <div className="overflow-hidden rounded-card border border-line bg-canvas">
      <div className="border-b border-line bg-paper px-4 py-3 sm:px-5">
        <p className="font-semibold text-ink">{name}</p>
        {isSample && (
          <p className="mt-1 text-[0.82rem] leading-snug text-gap">
            Sample analysis. Document reading isn’t connected in this demo, so your file was not read. These are example results.
          </p>
        )}
      </div>
      <dl className="divide-y divide-line">
        {rows.map((r) => (
          <div key={r.title} className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[170px_1fr] sm:gap-4 sm:px-5">
            <dt className="flex items-center gap-2 text-[0.88rem] font-semibold text-ink"><r.icon size={16} className={r.tone} aria-hidden />{r.title}</dt>
            <dd>
              <ul className="space-y-1 text-[0.93rem] leading-snug text-body">
                {r.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
