"use client";

import { formatCompactCurrency, formatPercent } from "@/lib/utils";
import type { ProductPerformance } from "@/types/api";

export function ProductTable({ title, products }: { title: string; products: ProductPerformance[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <span>🏆 {title}</span>
        </h3>
        <span className="cartoon-badge bg-amber-300">{products.length} Products</span>
      </div>

      {products.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-xs font-bold text-slate-600 bg-white/70 rounded-xl border border-slate-900">
          No product performance data in range.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a]">
          <table className="w-full text-xs font-extrabold text-slate-900 bg-white">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-amber-200 text-left uppercase tracking-wider">
                <th className="p-3">Product Name</th>
                <th className="p-3 text-right">Revenue</th>
                <th className="p-3 text-right">Profit</th>
                <th className="p-3 text-right">Margin</th>
                <th className="p-3 text-right">Units</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, idx) => (
                <tr key={product.product_ref} className="border-b border-slate-300 hover:bg-yellow-50 transition-colors">
                  <td className="p-3 max-w-[220px] truncate" title={product.name}>
                    <span className="inline-flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                        {idx + 1}
                      </span>
                      {product.name}
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums">{formatCompactCurrency(product.revenue)}</td>
                  <td className={`p-3 text-right tabular-nums ${product.profit < 0 ? "text-rose-600 font-bold" : "text-emerald-700"}`}>
                    {formatCompactCurrency(product.profit)}
                  </td>
                  <td className="p-3 text-right tabular-nums">{formatPercent(product.margin_pct)}</td>
                  <td className="p-3 text-right tabular-nums">{product.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
