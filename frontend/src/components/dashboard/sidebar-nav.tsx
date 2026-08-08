"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Database, FileOutput, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { UploadAuthModal } from "@/components/forms/upload-auth-modal";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/datasets", label: "Datasets", icon: Database },
  { href: "/reports", label: "Reports", icon: FileOutput },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user, organization, isGuest, logout } = useAuth();
  const [showUploadAuth, setShowUploadAuth] = useState(false);

  return (
    <>
      <aside className="flex h-screen w-64 flex-col border-r border-border bg-background z-20">
        {/* Brand Header */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-foreground leading-tight">InsightIQ</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium leading-tight">Analytics</span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}`));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {/* Quick Action Button */}
          <div className="pt-6">
            <button
              onClick={() => {
                if (isGuest) {
                  setShowUploadAuth(true);
                } else {
                  window.location.href = "/datasets";
                }
              }}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Upload Dataset
            </button>
          </div>
        </nav>

        {/* User / Demo Status Footer */}
        <div className="border-t border-border p-4 bg-secondary/30">
          {isGuest ? (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-medium text-foreground">Guest Demo Mode</span>
              </div>
              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div className="mb-4 flex flex-col gap-1 px-1">
              <span className="truncate text-sm font-semibold text-foreground">{organization?.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.full_name} · {user?.role}
              </span>
            </div>
          )}

          {!isGuest && (
            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          )}
        </div>
      </aside>

      <UploadAuthModal isOpen={showUploadAuth} onClose={() => setShowUploadAuth(false)} />
    </>
  );
}
