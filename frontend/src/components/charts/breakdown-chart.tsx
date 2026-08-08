"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompactCurrency } from "@/lib/utils";
import type { Breakdown } from "@/types/api";

const BAR_COLOR = "#facc15"; // Vibrant Cartoon Yellow

export function BreakdownChart({ title, breakdown }: { title: string; breakdown: Breakdown | undefined }) {
  const items = (breakdown?.items ?? []).slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
        <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
      </div>
      {items.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-xs font-bold text-slate-600 bg-white/70 rounded-xl border border-slate-900">
          No data in range.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, items.length * 36)}>
          <BarChart data={items} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" />
            <XAxis type="number" tickFormatter={(v) => formatCompactCurrency(v)} tick={{ fontSize: 11, fontWeight: 700, fill: "#0f172a" }} tickLine={false} axisLine={{ stroke: "#0f172a", strokeWidth: 2 }} />
            <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11, fontWeight: 700, fill: "#0f172a" }} tickLine={false} axisLine={{ stroke: "#0f172a", strokeWidth: 2 }} />
            <Tooltip formatter={(value: number) => formatCompactCurrency(value)} contentStyle={{ borderRadius: 12, border: "2px solid #0f172a", boxShadow: "3px 3px 0px 0px #0f172a", fontSize: 12, fontWeight: 700 }} />
            <Bar dataKey="revenue" name="Revenue" fill={BAR_COLOR} stroke="#0f172a" strokeWidth={2} radius={[0, 8, 8, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
