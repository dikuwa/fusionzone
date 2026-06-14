import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardNotificationPoller } from "@/components/dashboard/notification-poller";
import { requireAuth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { ProductSync } from "@/components/product-sync";
import { CatalogSync } from "@/components/catalog-sync";
import { DashboardToaster } from "@/components/ui/dashboard-toaster";
import { StoreDataSync } from "@/components/store-data-sync";
import { DashboardStateSync } from "@/components/dashboard/dashboard-state-sync";
import { ForcePasswordChange } from "@/components/auth/force-password-change";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/login");
  }

  // Keep first-login password changes outside the normal dashboard UI so this
  // works for every role and cannot redirect-loop on the settings route.
  if (user.mustChangePassword) {
    return <ForcePasswordChange userName={user.name} />;
  }

  return (
    <div className="dashboard-shell flex min-h-screen">
      <DashboardNotificationPoller />
      <ProductSync />
      <CatalogSync />
      <StoreDataSync />
      <DashboardStateSync />
      <DashboardSidebar
        user={{
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          image: user.image,
        }}
      />
      <main className="dashboard-main flex-1 overflow-auto bg-muted bg-noise">
        <div className="dashboard-content p-6 lg:p-8">{children}</div>
      </main>
      <DashboardToaster />
    </div>
  );
}
