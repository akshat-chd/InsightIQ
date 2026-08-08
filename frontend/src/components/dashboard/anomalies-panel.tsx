import type { AnomalyReport } from "@/types/api";
import { TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";

export function AnomaliesPanel({ anomalies }: { anomalies: AnomalyReport }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span>🚨 Isolation Forest Anomalies</span>
        </h3>
        <span className="cartoon-badge bg-rose-200">
          {anomalies.anomalies.length} Flagged
        </span>
      </div>

      {anomalies.anomalies.length === 0 ? (
        <div className="p-4 text-center text-xs font-bold text-slate-600 bg-white/70 rounded-xl border border-slate-900">
          {anomalies.note ?? "No statistically significant anomalies detected."}
        </div>
      ) : (
        <div className="space-y-2.5">
          {anomalies.anomalies.slice(0, 5).map((anomaly, index) => (
            <div
              key={`${anomaly.period}-${anomaly.metric}-${index}`}
              className="p-3 bg-white rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] flex items-start gap-2.5"
            >
              {anomaly.direction === "spike" ? (
                <TrendingUp className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <TrendingDown className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900">{anomaly.period}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-900 ${
                      anomaly.severity === "high"
                        ? "bg-rose-300 text-slate-900"
                        : anomaly.severity === "medium"
                          ? "bg-amber-300 text-slate-900"
                          : "bg-sky-200 text-slate-900"
                    }`}
                  >
                    {anomaly.severity} severity
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-700 font-medium leading-snug">{anomaly.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
