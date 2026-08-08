"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { RfmSummary } from "@/types/api";

const CARTOON_PIE_COLORS = ["#facc15", "#38bdf8", "#c084fc", "#4ade80", "#fb7185", "#fb923c"];

export function SegmentChart({ rfm }: { rfm: RfmSummary }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
        <h3 className="text-base font-extrabold text-slate-900">🎯 Customer Segments (RFM)</h3>
      </div>
      {rfm.segments.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-xs font-bold text-slate-600 bg-white/70 rounded-xl border border-slate-900">
          {rfm.note ?? "Not enough customer data in range."}
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={rfm.segments}
                dataKey="revenue_share_pct"
                nameKey="label"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                stroke="#0f172a"
                strokeWidth={2}
              >
                {rfm.segments.map((entry, index) => (
                  <Cell key={entry.cluster_id} fill={CARTOON_PIE_COLORS[index % CARTOON_PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} contentStyle={{ borderRadius: 12, border: "2px solid #0f172a", boxShadow: "3px 3px 0px 0px #0f172a", fontSize: 12, fontWeight: 700 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }} />
            </PieChart>
          </ResponsiveContainer>
          {rfm.note && <p className="text-[11px] font-semibold text-slate-600 italic bg-white/70 p-2 rounded-lg border border-slate-900">{rfm.note}</p>}
        </>
      )}
    </div>
  );
}
