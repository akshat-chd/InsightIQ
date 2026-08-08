"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MarkdownLite } from "@/components/dashboard/markdown-lite";
import { api, ApiError } from "@/lib/api-client";
import type { InsightBundle } from "@/types/api";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";

export function AIInsightsPanel({ analysisRunId }: { analysisRunId: string }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"summary" | "root-cause" | "recommendations" | "risks">("summary");

  const { data, isLoading } = useQuery({
    queryKey: ["ai-insights", analysisRunId],
    queryFn: async () => {
      try {
        return await api.get<InsightBundle>(`/ai/insights/${analysisRunId}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: Boolean(analysisRunId),
  });

  const generate = useMutation({
    mutationFn: (refresh: boolean) => api.post<InsightBundle>("/ai/generate", { analysis_run_id: analysisRunId, refresh }),
    onSuccess: (bundle) => {
      queryClient.setQueryData(["ai-insights", analysisRunId], bundle);
    },
  });

  const bundle = data ?? generate.data;

  return (
    <div className="space-y-4">
      {/* Header Badges & Generate Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h3 className="font-extrabold text-slate-900 text-sm">OpenAI Executive Narrative</h3>
          {bundle?.degraded ? (
            <span className="cartoon-badge bg-amber-200">
              <AlertCircle className="h-3 w-3" /> Offline Analyst
            </span>
          ) : (
            <span className="cartoon-badge bg-emerald-200">
              <Sparkles className="h-3 w-3 text-emerald-800" /> GPT-4o Live Model
            </span>
          )}
        </div>

        <button
          onClick={() => generate.mutate(Boolean(bundle))}
          disabled={generate.isPending}
          className="cartoon-btn-purple text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#0f172a]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${generate.isPending ? "animate-spin" : ""}`} />
          {generate.isPending ? "Generating..." : bundle ? "Regenerate AI Narrative" : "Generate OpenAI Insights"}
        </button>
      </div>

      {bundle?.degraded_reason && (
        <div className="p-2.5 rounded-xl border-2 border-slate-900 bg-amber-100 text-xs font-bold text-slate-800">
          ℹ️ {bundle.degraded_reason}
        </div>
      )}

      {isLoading ? (
        <div className="p-6 text-center text-xs font-bold text-slate-600 animate-pulse bg-white/70 rounded-xl border border-slate-900">
          Analyzing metrics & generating narrative with OpenAI...
        </div>
      ) : !bundle ? (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center bg-purple-50/60 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-200 border-2 border-slate-900 text-2xl">
            ✨
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm">Generate OpenAI Decision Support Narrative</h4>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Creates executive summary, root-cause analysis, and strategic recommendations over your exact metrics.
            </p>
          </div>
          <button
            onClick={() => generate.mutate(false)}
            disabled={generate.isPending}
            className="cartoon-btn-purple text-xs py-2 px-4 mt-1"
          >
            {generate.isPending ? "Generating Insights..." : "🚀 Generate OpenAI Insights"}
          </button>
        </div>
      ) : (
        <>
          {/* Cartoon Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("summary")}
              className={`cartoon-btn text-xs py-1.5 px-3 ${activeTab === "summary" ? "bg-amber-300" : "bg-white text-slate-700"}`}
            >
              📝 Summary
            </button>
            <button
              onClick={() => setActiveTab("root-cause")}
              className={`cartoon-btn-purple text-xs py-1.5 px-3 ${activeTab === "root-cause" ? "bg-purple-300" : "bg-white text-slate-700"}`}
            >
              🔍 Root Cause
            </button>
            <button
              onClick={() => setActiveTab("recommendations")}
              className={`cartoon-btn-blue text-xs py-1.5 px-3 ${activeTab === "recommendations" ? "bg-sky-300" : "bg-white text-slate-700"}`}
            >
              💡 Recommendations
            </button>
            <button
              onClick={() => setActiveTab("risks")}
              className={`cartoon-btn text-xs py-1.5 px-3 ${activeTab === "risks" ? "bg-rose-300" : "bg-white text-slate-700"}`}
            >
              ⚠️ Risks
            </button>
          </div>

          {/* Tab Content Box */}
          <div className="cartoon-card bg-amber-50/50 p-4 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a]">
            {activeTab === "summary" && (
              <div className="prose prose-sm max-w-none text-slate-800 font-medium leading-relaxed">
                <MarkdownLite content={bundle.executive_summary?.content || "No summary narrative generated yet."} />
              </div>
            )}

            {activeTab === "root-cause" && (
              <div className="prose prose-sm max-w-none text-slate-800 font-medium leading-relaxed">
                <MarkdownLite content={bundle.root_cause?.content || "No root cause analysis available."} />
              </div>
            )}

            {activeTab === "recommendations" && (
              <div className="prose prose-sm max-w-none text-slate-800 font-medium leading-relaxed">
                <MarkdownLite content={bundle.recommendations?.content || "No recommendations generated."} />
              </div>
            )}

            {activeTab === "risks" && (
              <div className="prose prose-sm max-w-none text-slate-800 font-medium leading-relaxed">
                <MarkdownLite content={bundle.risks?.content || "No risk analysis generated."} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
