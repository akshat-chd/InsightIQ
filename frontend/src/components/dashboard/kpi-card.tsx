import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn, formatDelta, isImproving } from "@/lib/utils";
import type { MetricValue } from "@/types/api";

interface KpiCardProps {
  title?: string;
  label?: string;
  value?: MetricValue;
  metric?: MetricValue;
  format: (value: number) => string;
  higherIsBetter?: boolean;
  usePoints?: boolean;
  icon?: string;
  color?: string;
}

export function KpiCard({
  title,
  label,
  value,
  metric,
  format,
  higherIsBetter = true,
  usePoints = false,
  icon = "📊",
  color = "cartoon-card-yellow",
}: KpiCardProps) {
  const m = value || metric;
  const cardLabel = title || label || "";
  if (!m) return null;

  const delta = usePoints ? m.delta_abs : m.delta_pct;
  const improving = isImproving(delta, higherIsBetter);

  return (
    <div className={`${color} p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#0f172a]`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-800">{cardLabel}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{format(m.current)}</p>
      <div className="mt-2 flex items-center gap-1.5 text-xs font-bold">
        {improving === null ? (
          <span className="flex items-center gap-1 text-slate-600 bg-white/70 px-2 py-0.5 rounded-md border border-slate-900">
            <Minus className="h-3 w-3" /> flat
          </span>
        ) : (
          <span
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-900 shadow-[1px_1px_0px_0px_#0f172a]",
              improving ? "bg-emerald-300 text-slate-900" : "bg-rose-300 text-slate-900",
            )}
          >
            {improving ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
            {formatDelta(delta, usePoints)}
          </span>
        )}
        <span className="text-slate-600 text-[11px]">vs prior period</span>
      </div>
    </div>
  );
}
