"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Users, UserX, AlertCircle } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { Button } from "@/components/ui/button";
import { CreateUserDialog } from "@/components/staff/create-user-dialog";
import { StaffList } from "@/components/staff/staff-list";
import { Permissions } from "@/lib/permissions";
import { UserRole, UserStatus } from "@/lib/enums";
import { useRouter } from "next/navigation";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
  status: UserStatus;
  permissions: string[] | null;
  twoFactorEnabled: boolean;
  lastActiveAt: Date | null;
  createdAt: Date;
}

interface PendingInvitation {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string; email: string } | null;
}

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.STAFF);
  const [hasManagePermission, setHasManagePermission] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      const [staffRes, invitationsRes] = await Promise.all([
        fetch("/api/staff"),
        fetch("/api/invitations?status=PENDING&limit=50"),
      ]);

      if (staffRes.status === 401) {
        router.push("/login");
        return;
      }

      if (staffRes.status === 403) {
        setError("You don't have permission to view staff");
        return;
      }

      if (!staffRes.ok) {
        const data = await staffRes.json();
        throw new Error(data.error || "Failed to fetch staff");
      }

      const staffData = await staffRes.json();
      setStaff(staffData.staff);

      if (invitationsRes.ok) {
        const invitesData = await invitationsRes.json();
        setPendingInvitations(invitesData.invitations || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
    }
  }, [router]);

  const checkPermissions = async () => {
    try {
      const res = await fetch("/api/auth/get-session");
      if (res.ok) {
        const session = await res.json();
        if (session?.user) {
          setCurrentUserRole(session.user.role as UserRole);
          // Check if user has staff:manage permission
          const permissions = session.user.permissions || [];
          setHasManagePermission(
            session.user.role === UserRole.OWNER ||
            permissions.includes(Permissions.USERS_INVITE) ||
            permissions.includes(Permissions.USERS_CREATE)
          );
        }
      }
    } catch (error) {
      console.error("Failed to check permissions:", error);
    }
  };

  useEffect(() => {
    fetchStaff();
    checkPermissions();
  }, [fetchStaff]);

  const activeCount = staff.filter((s) => s.status === UserStatus.ACTIVE).length;
  const disabledCount = staff.filter((s) => s.status === UserStatus.DISABLED).length;
  const suspendedCount = staff.filter((s) => s.status === UserStatus.SUSPENDED).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage team members and their access permissions
          </p>
        </div>
        {hasManagePermission && (
          <Button onClick={() => setCreateUserOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, color: "text-success", bg: "bg-success/10", label: "Active", count: activeCount },
          { icon: UserX, color: "text-warning", bg: "bg-warning/10", label: "Disabled", count: disabledCount },
          { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Suspended", count: suspendedCount },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <FadeIn key={stat.label} delay={i * 0.06}>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.count}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}



      <FadeIn delay={0.2}>
        <StaffList
          staff={staff}
          pendingInvitations={pendingInvitations}
          currentUserRole={currentUserRole}
          onUpdate={fetchStaff}
        />
      </FadeIn>

      <CreateUserDialog
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
        currentUserRole={currentUserRole}
        onSuccess={fetchStaff}
      />
    </div>
  );
}
