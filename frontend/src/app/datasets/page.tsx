"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadDropzone } from "@/components/forms/upload-dropzone";
import { ValidationReportView } from "@/components/forms/validation-report-view";
import { ProtectedShell } from "@/components/dashboard/protected-shell";
import { api, ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import type { DatasetOut, DatasetStatus, EntityType, Page, UploadResponse } from "@/types/api";
import { Loader2 } from "lucide-react";

const ENTITY_TABS: { value: EntityType; label: string }[] = [
  { value: "generic", label: "Generic Dataset" },
  { value: "orders", label: "Orders" },
  { value: "customers", label: "Customers" },
  { value: "products", label: "Products" },
  { value: "returns", label: "Returns" },
];

const STATUS_VARIANT: Record<DatasetStatus, "success" | "warning" | "destructive" | "secondary"> = {
  ingested: "success",
  partial: "warning",
  failed: "destructive",
  pending: "secondary",
  validating: "secondary",
};

function UploadPanel({ entityType }: { entityType: EntityType }) {
  const queryClient = useQueryClient();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [lastResult, setLastResult] = useState<UploadResponse | null>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.upload<UploadResponse>(`/datasets/upload/${entityType}`, formData);
    },
    onSuccess: (response) => {
      setLastResult(response);
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  return (
    <div className="space-y-4">
      <UploadDropzone
        disabled={upload.isPending}
        onFileSelected={(file) => {
          setPendingFile(file);
          setLastResult(null);
          upload.mutate(file);
        }}
      />
      {upload.isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Validating and importing {pendingFile?.name}…
        </div>
      )}
      {upload.isError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {upload.error instanceof ApiError ? upload.error.message : "Upload failed."}
        </div>
      )}
      {lastResult && (
        <Card>
          <CardContent className="pt-6">
            <ValidationReportView report={lastResult.report} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DatasetHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => api.get<Page<DatasetOut>>("/datasets", { limit: 20 }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data || data.items.length === 0) return <p className="text-sm text-muted-foreground">No uploads yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="pb-2 pr-2 font-medium">File</th>
            <th className="pb-2 pr-2 font-medium">Entity</th>
            <th className="pb-2 pr-2 font-medium">Status</th>
            <th className="pb-2 pr-2 text-right font-medium">Accepted</th>
            <th className="pb-2 pr-2 text-right font-medium">Rejected</th>
            <th className="pb-2 font-medium">Uploaded</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((dataset) => (
            <tr key={dataset.id} className="border-b last:border-0">
              <td className="max-w-[200px] truncate py-2 pr-2" title={dataset.original_filename}>{dataset.original_filename}</td>
              <td className="py-2 pr-2 capitalize">{dataset.entity_type}</td>
              <td className="py-2 pr-2">
                <Badge variant={STATUS_VARIANT[dataset.status]} className="capitalize">{dataset.status}</Badge>
              </td>
              <td className="py-2 pr-2 text-right tabular-nums">{dataset.rows_accepted}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{dataset.rows_rejected}</td>
              <td className="py-2 text-muted-foreground">{formatDate(dataset.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DatasetsPage() {
  return (
    <ProtectedShell>
      <div className="space-y-6 max-w-6xl mx-auto p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Datasets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload any CSV file for AI analysis, or structured files for Retail metrics.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Upload Data</CardTitle>
          <CardDescription>
            Select &quot;Generic Dataset&quot; to upload any CSV file (like employment data). The AI will dynamically analyze it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generic">
            <TabsList>
              {ENTITY_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>
            {ENTITY_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                <UploadPanel entityType={tab.value} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DatasetHistory />
        </CardContent>
      </Card>
    </div>
    </ProtectedShell>
  );
}
