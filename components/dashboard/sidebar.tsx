"use client";

import Link from "next/link";
import { useDashboardStore } from "@/lib/store/dashboard";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderOpen,
  Tags,
  Users,
  FileText,
  Wallet,
  Bell,
  UserCog,
  Settings,
  CalendarClock,
  LogOut,
  ChevronLeft,
  Megaphone,
  ExternalLink,
  PackageSearch,
  History,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { UserRole } from "@/lib/enums";
import { hasPermission, Permissions, type Permission } from "@/lib/permissions";

const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/categories", label: "Categories & Brands", icon: FolderOpen },
  { href: "/dashboard/promotions", label: "Promotions", icon: Megaphone },
  { href: "/dashboard/services", label: "Services", icon: FileText },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/follow-ups", label: "Follow-ups", icon: CalendarClock },
  { href: "/dashboard/receipts", label: "Receipts", icon: FileText },
  { href: "/dashboard/quotations", label: "Quotations", icon: FileText },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/back-in-stock", label: "Stock Notification Requests", icon: PackageSearch },
];

const monitoringNavItems = [
  { href: "/dashboard/audit-log", label: "Audit Log", icon: History },
];

const financialNavItems = [
  { href: "/dashboard/payments", label: "Payments", icon: Wallet },
];

const staffNavItems = [
  { href: "/dashboard/staff", label: "Users", icon: UserCog },
];

const bottomNavItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const navPermissions: Record<string, Permission> = {
  "/dashboard": Permissions.DASHBOARD_VIEW,
  "/dashboard/orders": Permissions.ORDERS_VIEW,
  "/dashboard/products": Permissions.PRODUCTS_VIEW,
  "/dashboard/categories": Permissions.CATEGORIES_VIEW,
  "/dashboard/promotions": Permissions.PROMOTIONS_VIEW,
  "/dashboard/customers": Permissions.CUSTOMERS_VIEW,
  "/dashboard/follow-ups": Permissions.FOLLOWUPS_VIEW,
  "/dashboard/receipts": Permissions.DOCUMENTS_VIEW,
  "/dashboard/quotations": Permissions.DOCUMENTS_VIEW,
  "/dashboard/notifications": Permissions.NOTIFICATIONS_VIEW,
  "/dashboard/back-in-stock": Permissions.STOCK_REQUESTS_VIEW,
  "/dashboard/audit-log": Permissions.AUDIT_LOGS_VIEW,
  "/dashboard/payments": Permissions.PAYMENTS_VIEW,
  "/dashboard/staff": Permissions.USERS_VIEW,
  "/dashboard/services": Permissions.SERVICES_VIEW,
  "/dashboard/settings": Permissions.SETTINGS_VIEW,
};

interface DashboardSidebarProps {
  user: {
    name: string;
    role: UserRole;
    permissions: Permission[];
    image?: string | null;
  };
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const canAccess = (href: string) =>
    hasPermission(user.role, user.permissions, navPermissions[href] ?? Permissions.DASHBOARD_VIEW);
  const unreadNotifications = useDashboardStore((s) => s.notifications.filter(n => !n.isRead).length);
  const newStockRequests = useDashboardStore((s) => s.backInStockRequests.filter(r => r.status === "New").length);
  const navOrder = useDashboardStore((s) => s.navOrder);

  // Sort admin nav items by saved navOrder (fall back to default array order)
  const sortedAdminNavItems = [...adminNavItems].sort((a, b) => {
    const aIdx = navOrder.indexOf(a.href);
    const bIdx = navOrder.indexOf(b.href);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch {}
    window.location.href = "/admin";
  };

  return (
    <aside
      className={cn(
        "dashboard-sidebar flex flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            <Link href="/dashboard" className="text-lg font-bold tracking-tight">
              Fusion<span className="text-primary">Zone</span>
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 hover:text-primary hover:bg-accent transition-colors"
              title="View site"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(collapsed && "mx-auto")}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Quick SKU Lookup */}
      {canAccess("/dashboard/products") && (collapsed ? (
        <div className="flex justify-center py-3">
          <button
            onClick={() => router.push("/dashboard/products")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Search products by SKU"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="px-3 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search SKU..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    router.push(`/dashboard/products?sku=${encodeURIComponent(val)}`);
                  }
                }
              }}
              className="h-8 w-full rounded-md border border-border bg-muted/50 pl-7 pr-2 text-xs placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      ))}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {sortedAdminNavItems.filter((item) => canAccess(item.href)).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          let count = 0;
          if (item.href === "/dashboard/notifications") count = unreadNotifications;
          if (item.href === "/dashboard/back-in-stock") count = newStockRequests;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <div className="relative shrink-0">
                <Icon className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground leading-none">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </div>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {financialNavItems.filter((item) => canAccess(item.href)).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {financialNavItems.some((item) => canAccess(item.href)) && !collapsed && <div className="my-2 border-t border-border" />}

        {staffNavItems.filter((item) => canAccess(item.href)).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {monitoringNavItems.filter((item) => canAccess(item.href)).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        <div className="pt-2 mt-2 border-t border-border" />

        {bottomNavItems.filter((item) => canAccess(item.href)).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

      </nav>

      {/* User block */}
      <div className={cn("border-t border-border p-4", collapsed && "flex justify-center")}>
        <div className={cn("flex items-center gap-3", collapsed && "flex-col")}>
          <Avatar className="h-8 w-8">
            {user.image ? (
              <img src={user.image} alt="" className="h-full w-full rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
