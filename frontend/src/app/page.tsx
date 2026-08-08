"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ProtectedShell } from "@/components/dashboard/protected-shell";
import { UploadAuthModal } from "@/components/forms/upload-auth-modal";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formatCompactCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { DatasetOut, Page } from "@/types/api";
import { FileSpreadsheet, Loader2, RefreshCw, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
export default function HomePage() {
  const { isGuest } = useAuth();
  const [showUploadAuth, setShowUploadAuth] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  const { data: datasetsPage, isLoading: loadingDatasets } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => api.get<Page<DatasetOut>>("/datasets?limit=10"),
  });

  const datasets = datasetsPage?.items || [];

  const { data: insights, isLoading: loadingInsights, error: insightsError } = useQuery({
    queryKey: ["generic-insights", selectedDataset],
    queryFn: () => api.get<any>(`/ai/generic/${selectedDataset}`),
    enabled: Boolean(selectedDataset),
    retry: false,
  });

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedDataset) return;
    const newMsg = { role: "user", content: chatMessage };
    setChatHistory([...chatHistory, newMsg]);
    setChatMessage("");
    setIsChatting(true);
    
    try {
      const res = await api.post<any>(`/ai/generic/${selectedDataset}/chat`, {
        message: newMsg.content,
        history: chatHistory,
      });
      setChatHistory((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <ProtectedShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-lg border shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analytics Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select an uploaded dataset to view dynamic AI insights and schema analysis.
            </p>
          </div>
          <button
            onClick={() => {
              if (isGuest) {
                setShowUploadAuth(true);
              } else {
                window.location.href = "/datasets";
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Upload New Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Dataset Selector */}
          <div className="md:col-span-1 space-y-4">
            <h2 className="font-semibold text-lg">Your Datasets</h2>
            {loadingDatasets ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : datasets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No datasets found. Upload one to begin.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {datasets.map((ds) => (
                  <button
                    key={ds.id}
                    onClick={() => setSelectedDataset(ds.id)}
                    className={`flex flex-col text-left p-3 rounded-md border transition-colors ${
                      selectedDataset === ds.id
                        ? "bg-primary/5 border-primary shadow-sm"
                        : "bg-card hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium text-sm truncate w-full flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {ds.original_filename}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatNumber(ds.rows_total)} rows • {ds.entity_type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Insights Viewer */}
          <div className="md:col-span-3">
            {!selectedDataset ? (
              <div className="h-full min-h-[300px] border rounded-lg border-dashed flex flex-col items-center justify-center text-muted-foreground bg-card/50">
                <FileSpreadsheet className="h-8 w-8 mb-2 opacity-50" />
                <p>Select a dataset to view its insights</p>
              </div>
            ) : loadingInsights ? (
              <div className="h-full min-h-[300px] border rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-card">
                <Loader2 className="h-8 w-8 mb-4 animate-spin text-primary" />
                <p>Analyzing dataset schema and generating AI report...</p>
                <p className="text-xs opacity-70 mt-2">This may take up to 20 seconds.</p>
              </div>
            ) : insightsError ? (
              <div className="border rounded-lg p-6 bg-destructive/10 text-destructive">
                <h3 className="font-semibold mb-2">Analysis Failed</h3>
                <p className="text-sm">{(insightsError as any)?.message || "Could not analyze this dataset."}</p>
                <p className="text-xs mt-2 opacity-80">Check if the dataset contains raw generic data or has valid formatting.</p>
              </div>
            ) : insights ? (
              <div className="space-y-6">
                {/* Executive Summary */}
                <div className="bg-card rounded-lg border shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <SparklesIcon /> Executive Summary
                  </h2>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                    <ReactMarkdown>{insights.narrative}</ReactMarkdown>
                  </div>
                </div>

                {/* Dynamic Charts */}
                {insights.charts && insights.charts.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {insights.charts.map((chart: any) => (
                      <div key={chart.id} className="bg-card rounded-lg border shadow-sm p-6">
                        <h3 className="text-md font-semibold mb-4">{chart.title}</h3>
                        <div className="h-[250px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart.data}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Column Stats */}
                <div className="bg-card rounded-lg border shadow-sm p-6">
                  <h3 className="text-md font-semibold mb-4">Numeric Profile</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                        <tr>
                          <th className="px-4 py-2 font-medium">Column</th>
                          <th className="px-4 py-2 font-medium text-right">Mean</th>
                          <th className="px-4 py-2 font-medium text-right">Min</th>
                          <th className="px-4 py-2 font-medium text-right">Max</th>
                          <th className="px-4 py-2 font-medium text-right">Missing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insights.stats.map((stat: any) => (
                          <tr key={stat.column} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="px-4 py-2 font-medium">{stat.column}</td>
                            <td className="px-4 py-2 text-right">{formatNumber(stat.mean)}</td>
                            <td className="px-4 py-2 text-right">{formatNumber(stat.min)}</td>
                            <td className="px-4 py-2 text-right">{formatNumber(stat.max)}</td>
                            <td className="px-4 py-2 text-right text-muted-foreground">{stat.missing}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Chat Interface */}
                <div className="bg-card rounded-lg border shadow-sm flex flex-col h-[400px]">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold flex items-center gap-2">Chat with Dataset</h3>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {chatHistory.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        Ask a follow-up question about this dataset...
                      </div>
                    ) : (
                      chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {msg.role === 'user' ? msg.content : (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    {isChatting && (
                      <div className="flex justify-start">
                        <div className="bg-muted text-muted-foreground rounded-lg p-3 text-sm flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t">
                    <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Ask anything..."
                        className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        disabled={isChatting}
                      />
                      <button
                        type="submit"
                        disabled={isChatting || !chatMessage.trim()}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <UploadAuthModal isOpen={showUploadAuth} onClose={() => setShowUploadAuth(false)} />
    </ProtectedShell>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
