"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import type { AnalysisRunOut, Page, ReportFormat, DatasetOut } from "@/types/api";
import { FileDown, FileText, Loader2 } from "lucide-react";
import { ProtectedShell } from "@/components/dashboard/protected-shell";

export default function ReportsPage() {
  const [selectedRun, setSelectedRun] = useState<string>("");
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [title, setTitle] = useState("");
  const [includeAI, setIncludeAI] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [activeTab, setActiveTab] = useState("retail");

  const runs = useQuery({
    queryKey: ["analysis-runs"],
    queryFn: () => api.get<Page<AnalysisRunOut>>("/analytics/runs", { limit: 20 }),
  });

  const datasets = useQuery({
    queryKey: ["datasets"],
    queryFn: () => api.get<Page<DatasetOut>>("/datasets?limit=20"),
  });
  const genericDatasets = datasets.data?.items.filter(d => d.entity_type === "generic") || [];

  const exportReport = useMutation({
    mutationFn: async () => {
      const isGeneric = activeTab === "generic";
      const endpoint = isGeneric ? "/reports/export-generic" : "/reports/export";
      const payload = isGeneric 
        ? {
            dataset_id: selectedDataset,
            format: "pdf", // Generic only supports PDF currently
            title: title || null,
            include_ai_narrative: includeAI,
            include_charts: includeCharts,
          }
        : {
            analysis_run_id: selectedRun,
            format,
            title: title || null,
            include_ai_narrative: includeAI,
            include_charts: includeCharts,
          };

      const blob = await api.download(endpoint, payload);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `insightiq-report.${isGeneric ? 'pdf' : format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });

  return (
    <ProtectedShell>
    <div className="space-y-6 p-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Export generated AI narratives and dashboard visuals to shareable formats.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="retail">Retail Analytics</TabsTrigger>
          <TabsTrigger value="generic">Generic Datasets</TabsTrigger>
        </TabsList>
        
        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export a report</CardTitle>
              <CardDescription>
                {activeTab === "retail" 
                  ? "Charts are rendered server-side; the AI narrative section is optional."
                  : "Generates a PDF analysis for your generic dataset on the fly."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {activeTab === "retail" ? (
                <div className="space-y-1.5">
                  <Label>Analysis run</Label>
                  <Select value={selectedRun} onValueChange={setSelectedRun}>
                    <SelectTrigger><SelectValue placeholder="Select a computed analysis" /></SelectTrigger>
                    <SelectContent>
                      {runs.data?.items.map((run) => (
                        <SelectItem key={run.id} value={run.id}>
                          {run.period_start} → {run.period_end} ({formatDate(run.created_at)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {runs.data?.items.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No analysis runs yet. Visit the dashboard first to compute one.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Generic Dataset</Label>
                  <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                    <SelectTrigger><SelectValue placeholder="Select a dataset" /></SelectTrigger>
                    <SelectContent>
                      {genericDatasets.map((ds) => (
                        <SelectItem key={ds.id} value={ds.id}>
                          {ds.original_filename} ({formatDate(ds.created_at)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {genericDatasets.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No generic datasets found. Upload one to begin.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Format</Label>
                <Select 
                  value={activeTab === "generic" ? "pdf" : format} 
                  onValueChange={(v) => setFormat(v as ReportFormat)}
                  disabled={activeTab === "generic"}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="pptx">PowerPoint</SelectItem>
                  </SelectContent>
                </Select>
                {activeTab === "generic" && (
                  <p className="text-xs text-muted-foreground mt-1">Generic reports are currently only available in PDF format.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Title (optional)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={activeTab === "retail" ? "Executive Business Review" : "Dataset Analysis"} />
              </div>

              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeCharts} onChange={(e) => setIncludeCharts(e.target.checked)} className="h-4 w-4" />
                <span>Include charts</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeAI} onChange={(e) => setIncludeAI(e.target.checked)} className="h-4 w-4" />
                <span>Include AI narrative (if generated)</span>
              </div>

              <Button
                className="w-full gap-2"
                disabled={(activeTab === "retail" ? !selectedRun : !selectedDataset) || exportReport.isPending}
                onClick={() => exportReport.mutate()}
              >
                {exportReport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (activeTab === "generic" || format === "pdf") ? <FileText className="h-4 w-4" /> : <FileDown className="h-4 w-4" />}
                {exportReport.isPending ? "Generating…" : `Export ${(activeTab === "generic" ? "pdf" : format).toUpperCase()}`}
              </Button>

              {exportReport.isError && (
                <p className="text-sm text-destructive">
                  {exportReport.error instanceof ApiError ? exportReport.error.message : "Export failed."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
    </ProtectedShell>
  );
}
