"use client";

import type { AnalyticsFilters, ComparisonMode, FilterOptionsOut, Granularity } from "@/types/api";
import { RotateCcw } from "lucide-react";

interface FilterBarProps {
  filters?: AnalyticsFilters;
  value?: AnalyticsFilters;
  options: FilterOptionsOut | undefined;
  onChange: (next: AnalyticsFilters) => void;
  onReset?: () => void;
}

export function FilterBar({ filters: filtersProp, value: valueProp, options, onChange, onReset }: FilterBarProps) {
  const currentFilters = valueProp || filtersProp;
  if (!currentFilters) return null;

  function toggle(key: "regions" | "categories" | "sub_categories" | "segments", val: string) {
    if (!currentFilters) return;
    const arr = currentFilters[key] || [];
    const next = arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
    onChange({ ...currentFilters, [key]: next });
  }

  const handleReset = () => {
    if (onReset) onReset();
    else if (currentFilters) {
      onChange({
        date_from: null,
        date_to: null,
        regions: [],
        categories: [],
        sub_categories: [],
        segments: [],
        granularity: "month",
        comparison: "previous_period",
        top_n: 10,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎛️</span>
          <h3 className="font-extrabold text-slate-900 text-sm">Interactive Analytics Filters</h3>
        </div>
        <button
          onClick={handleReset}
          className="cartoon-btn text-xs py-1 px-2.5 flex items-center gap-1 bg-amber-200 hover:bg-amber-300"
        >
          <RotateCcw className="h-3 w-3" /> Reset Filters
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">From Date</label>
          <input
            type="date"
            className="rounded-xl border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_#0f172a] focus:outline-none"
            value={currentFilters.date_from ?? ""}
            min={options?.date_min ?? undefined}
            max={options?.date_max ?? undefined}
            onChange={(e) => onChange({ ...currentFilters, date_from: e.target.value || null })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">To Date</label>
          <input
            type="date"
            className="rounded-xl border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_#0f172a] focus:outline-none"
            value={currentFilters.date_to ?? ""}
            min={options?.date_min ?? undefined}
            max={options?.date_max ?? undefined}
            onChange={(e) => onChange({ ...currentFilters, date_to: e.target.value || null })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">Granularity</label>
          <select
            value={currentFilters.granularity}
            onChange={(e) => onChange({ ...currentFilters, granularity: e.target.value as Granularity })}
            className="rounded-xl border-2 border-slate-900 bg-amber-100 px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_#0f172a] focus:outline-none"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">Comparison Period</label>
          <select
            value={currentFilters.comparison}
            onChange={(e) => onChange({ ...currentFilters, comparison: e.target.value as ComparisonMode })}
            className="rounded-xl border-2 border-slate-900 bg-sky-100 px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_#0f172a] focus:outline-none"
          >
            <option value="previous_period">Previous Period</option>
            <option value="previous_year">Previous Year</option>
            <option value="none">No Comparison</option>
          </select>
        </div>
      </div>

      {/* Filter Chips for Dimensions */}
      {options && (
        <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
          {options.regions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-slate-700 min-w-[70px]">Regions:</span>
              {options.regions.map((region) => {
                const active = currentFilters.regions?.includes(region);
                return (
                  <button
                    key={region}
                    type="button"
                    onClick={() => toggle("regions", region)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold border border-slate-900 transition-all ${
                      active ? "bg-amber-400 text-slate-900 shadow-[2px_2px_0px_0px_#0f172a]" : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
          )}

          {options.categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-slate-700 min-w-[70px]">Categories:</span>
              {options.categories.map((category) => {
                const active = currentFilters.categories?.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggle("categories", category)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold border border-slate-900 transition-all ${
                      active ? "bg-sky-400 text-slate-900 shadow-[2px_2px_0px_0px_#0f172a]" : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
