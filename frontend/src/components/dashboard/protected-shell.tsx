"use client";

import { useAuth } from "@/lib/auth-context";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { isLoading, isGuest } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="font-medium text-foreground text-sm">Loading InsightIQ...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <SidebarNav />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Guest Demo Notification Banner */}
        {isGuest && (
          <div className="bg-primary/10 border-b border-primary/20 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground text-primary">
              <AlertCircle className="h-4 w-4" />
              <span>Demo Mode Active — Exploring live sample retail dataset.</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">Want to upload custom data?</span>
              <Link href="/login" className="text-sm font-medium hover:underline text-primary">
                Sign In / Register
              </Link>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
