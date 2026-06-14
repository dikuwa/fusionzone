"use client";

import { useState } from "react";
import { UserRole, UserStatus } from "@/lib/enums";
import { Permissions, DEFAULT_ROLE_PERMISSIONS, type Permission } from "@/lib/permissions";
import {
  MoreHorizontal,
  Shield,
  ShieldOff,
  UserX,
  Key,
  LogOut,
  Loader2,
  Pencil,
  Send,
  Smartphone,
  Trash2,
  AlertTriangle,
  Check,
  Save,
  MessageCircle,
} from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp-url";
import { useDashboardStore } from "@/lib/store/dashboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ============== PERMISSION GROUPS (reused from create-user-dialog) ==============

interface PermissionGroup {
  label: string;
  permissions: { key: Permission; label: string }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  { label: "Orders", permissions: [
    { key: Permissions.ORDERS_VIEW, label: "View" }, { key: Permissions.ORDERS_CREATE, label: "Create" },
    { key: Permissions.ORDERS_UPDATE, label: "Update" }, { key: Permissions.ORDERS_CANCEL, label: "Cancel" },
    { key: Permissions.ORDERS_DELETE, label: "Delete" },
  ]},
  { label: "Products & Inventory", permissions: [
    { key: Permissions.PRODUCTS_VIEW, label: "View" }, { key: Permissions.PRODUCTS_CREATE, label: "Create" },
    { key: Permissions.PRODUCTS_UPDATE, label: "Update" }, { key: Permissions.PRODUCTS_DELETE, label: "Delete" },
    { key: Permissions.PRODUCTS_MANAGE_STOCK, label: "Manage Stock" },
  ]},
  { label: "Categories & Brands", permissions: [
    { key: Permissions.CATEGORIES_VIEW, label: "View Categories" }, { key: Permissions.CATEGORIES_CREATE, label: "Create Categories" },
    { key: Permissions.CATEGORIES_UPDATE, label: "Update Categories" }, { key: Permissions.CATEGORIES_DELETE, label: "Delete Categories" },
    { key: Permissions.BRANDS_VIEW, label: "View Brands" }, { key: Permissions.BRANDS_CREATE, label: "Create Brands" },
    { key: Permissions.BRANDS_UPDATE, label: "Update Brands" }, { key: Permissions.BRANDS_DELETE, label: "Delete Brands" },
  ]},
  { label: "Promotions", permissions: [
    { key: Permissions.PROMOTIONS_VIEW, label: "View" }, { key: Permissions.PROMOTIONS_CREATE, label: "Create" },
    { key: Permissions.PROMOTIONS_UPDATE, label: "Update" }, { key: Permissions.PROMOTIONS_DELETE, label: "Delete" },
  ]},
  { label: "Customers", permissions: [
    { key: Permissions.CUSTOMERS_VIEW, label: "View" }, { key: Permissions.CUSTOMERS_UPDATE, label: "Update" },
    { key: Permissions.CUSTOMERS_EXPORT, label: "Export" },
  ]},
  { label: "Follow-ups", permissions: [
    { key: Permissions.FOLLOWUPS_VIEW, label: "View" }, { key: Permissions.FOLLOWUPS_CREATE, label: "Create" },
    { key: Permissions.FOLLOWUPS_UPDATE, label: "Update" }, { key: Permissions.FOLLOWUPS_DELETE, label: "Delete" },
  ]},
  { label: "Receipts & Quotations", permissions: [
    { key: Permissions.DOCUMENTS_VIEW, label: "View" }, { key: Permissions.DOCUMENTS_CREATE, label: "Create" },
    { key: Permissions.DOCUMENTS_UPDATE, label: "Update" }, { key: Permissions.DOCUMENTS_SEND, label: "Send" },
    { key: Permissions.DOCUMENTS_DELETE, label: "Delete" },
  ]},
  { label: "Notifications", permissions: [
    { key: Permissions.NOTIFICATIONS_VIEW, label: "View" }, { key: Permissions.NOTIFICATIONS_MANAGE, label: "Manage" },
  ]},
  { label: "Stock Requests", permissions: [
    { key: Permissions.STOCK_REQUESTS_VIEW, label: "View" }, { key: Permissions.STOCK_REQUESTS_UPDATE, label: "Update" },
    { key: Permissions.STOCK_REQUESTS_DELETE, label: "Delete" }, { key: Permissions.STOCK_REQUESTS_EXPORT, label: "Export" },
  ]},
  { label: "Payments", permissions: [
    { key: Permissions.PAYMENTS_VIEW, label: "View" }, { key: Permissions.PAYMENTS_CREATE, label: "Record" },
    { key: Permissions.PAYMENTS_UPDATE, label: "Edit" }, { key: Permissions.PAYMENTS_REFUND, label: "Refund" },
    { key: Permissions.PAYMENTS_EXPORT, label: "Export" },
  ]},
  { label: "Users", permissions: [
    { key: Permissions.USERS_VIEW, label: "View" }, { key: Permissions.USERS_INVITE, label: "Invite" },
    { key: Permissions.USERS_CREATE, label: "Create Directly" }, { key: Permissions.USERS_EDIT, label: "Edit Profiles" },
    { key: Permissions.USERS_ASSIGN_ROLES, label: "Assign Roles" }, { key: Permissions.USERS_MANAGE_PERMISSIONS, label: "Manage Permissions" },
    { key: Permissions.USERS_SUSPEND, label: "Suspend" }, { key: Permissions.USERS_DISABLE, label: "Disable" },
    { key: Permissions.USERS_DELETE, label: "Delete" },
  ]},
  { label: "Audit Log", permissions: [
    { key: Permissions.AUDIT_LOGS_VIEW, label: "View" }, { key: Permissions.AUDIT_LOGS_EXPORT, label: "Export" },
  ]},
  { label: "Settings", permissions: [
    { key: Permissions.SETTINGS_VIEW, label: "View" }, { key: Permissions.SETTINGS_UPDATE, label: "Update" },
  ]},
  { label: "Dashboard", permissions: [
    { key: Permissions.DASHBOARD_VIEW, label: "View Operational Stats" },
    { key: Permissions.DASHBOARD_VIEW_FINANCIAL_SUMMARY, label: "View Financial Summary" },
  ]},
];

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
  phone?: string | null;
  note?: string | null;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string; email: string } | null;
}

interface StaffListProps {
  staff: StaffMember[];
  pendingInvitations?: PendingInvitation[];
  currentUserRole: UserRole;
  onUpdate: () => void;
}

// ============== INLINE PERMISSION EDITOR ==============

function QuickPermissionEditor({
  member,
  currentUserRole,
  onSave,
  onCancel,
}: {
  member: StaffMember;
  currentUserRole: UserRole;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [role, setRole] = useState<UserRole>(member.role);
  const [perms, setPerms] = useState<Permission[]>(
    (member.permissions as Permission[]) ||
      DEFAULT_ROLE_PERMISSIONS[member.role] ||
      []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePerm = (perm: Permission) => {
    setPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, permissions: perms }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update permissions");
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // Show only the most relevant groups for quick edit
  const quickGroups = PERMISSION_GROUPS.filter(
    (g) =>
      !["Orders", "Products & Inventory", "Receipts & Quotations", "Notifications", "Dashboard"].includes(g.label)
  );

  const sensitiveGroups = ["Users", "Payments"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
          Quick Permissions
        </span>
        <div className="flex items-center gap-1.5">
          {/* Role selector */}
          <Select value={role} onValueChange={(r) => {
            const newRole = r as UserRole;
            setRole(newRole);
            setPerms(DEFAULT_ROLE_PERMISSIONS[newRole] || []);
          }}>
            <SelectTrigger className="h-7 text-[11px] px-2 w-auto min-w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UserRole.STAFF} className="text-[11px]">Staff</SelectItem>
              <SelectItem value={UserRole.ADMIN} className="text-[11px]">Admin</SelectItem>
              {currentUserRole === UserRole.OWNER && (
                <SelectItem value={UserRole.OWNER} className="text-[11px]">Owner</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-destructive">{error}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {quickGroups.map((group) => {
          // Hide sensitive groups for non-OWNER editors
          if (
            currentUserRole !== UserRole.OWNER &&
            sensitiveGroups.includes(group.label)
          ) {
            const visiblePerms = group.permissions.filter((p) =>
              perms.includes(p.key)
            );
            if (visiblePerms.length === 0) return null;
            return visiblePerms.map((perm) => (
              <span
                key={perm.key}
                className="rounded-[3px] bg-muted px-1.5 py-[1px] text-[9px] font-semibold text-muted-foreground"
              >
                {group.label.slice(0, 4)}:{perm.label}
              </span>
            ));
          }

          return (
            <div key={group.label} className="flex flex-wrap gap-1 items-center">
              <span className="text-[9px] font-bold text-muted-foreground mr-0.5">
                {group.label === "Categories & Brands"
                  ? "C&B:"
                  : group.label === "Stock Requests"
                  ? "Stock:"
                  : group.label === "Follow-ups"
                  ? "F/Up:"
                  : `${group.label.slice(0, 4)}:`}
              </span>
              {group.permissions.map((perm) => {
                const isOn = perms.includes(perm.key);

                const isOwnerOnlyPermission =
                  currentUserRole !== UserRole.OWNER &&
                  perm.key === Permissions.USERS_DELETE;

                const financialPerms = [
                  Permissions.PAYMENTS_VIEW,
                  Permissions.PAYMENTS_CREATE,
                  Permissions.PAYMENTS_UPDATE,
                  Permissions.PAYMENTS_REFUND,
                  Permissions.PAYMENTS_EXPORT,
                  Permissions.DASHBOARD_VIEW_FINANCIAL_SUMMARY,
                ] as const;
                const isFinancialRestricted =
                  currentUserRole !== UserRole.OWNER &&
                  (financialPerms as readonly string[]).includes(perm.key);

                const isDisabled = isOwnerOnlyPermission || isFinancialRestricted;

                if (isDisabled) {
                  return (
                    <span
                      key={perm.key}
                      className={`rounded-[3px] px-1.5 py-[1px] text-[9px] font-bold leading-none ${
                        isOn
                          ? "bg-muted text-muted-foreground/50 border border-dashed border-muted-foreground/20"
                          : "bg-muted text-muted-foreground/40 border border-transparent"
                      }`}
                      title={
                        isOwnerOnlyPermission
                          ? "Only the Owner can assign this permission"
                          : "Only the Owner can grant financial access"
                      }
                    >
                      {perm.label}
                    </span>
                  );
                }

                return (
                  <button
                    key={perm.key}
                    type="button"
                    onClick={() => togglePerm(perm.key)}
                    className={`rounded-[3px] px-1.5 py-[1px] text-[9px] font-bold leading-none transition-colors ${
                      isOn
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground border border-transparent hover:border-border hover:text-foreground"
                    }`}
                  >
                    {isOn ? perm.label : perm.label}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-muted-foreground flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPerms(DEFAULT_ROLE_PERMISSIONS[role] || [])}
          className="text-primary hover:text-primary/80 transition-colors"
        >
          ↻ Reset to {role} defaults
        </button>
        <span className="ml-auto">{perms.length} permissions</span>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-7 text-[11px]">
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={saving} className="h-7 text-[11px]">
          {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          <Save className="mr-1 h-3 w-3" />
          Save
        </Button>
      </div>
    </div>
  );
}

// ============== MAIN COMPONENT ==============

export function StaffList({ staff, pendingInvitations = [], currentUserRole, onUpdate }: StaffListProps) {
  const settings = useDashboardStore((s) => s.settings);
  const storeName = settings?.storeName || "Desert Technology Consultant";
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "activate" | "disable" | "reactivate" | "unlock" | "revoke-sessions" | "delete";
    member: StaffMember;
  } | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<StaffMember | null>(null);
  const [editRole, setEditRole] = useState<UserRole | null>(null);
  const [editPerms, setEditPerms] = useState<Permission[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editInvitation, setEditInvitation] = useState<PendingInvitation | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [invEditRole, setInvEditRole] = useState<string>("");
  const [invEditSaving, setInvEditSaving] = useState(false);
  const [invEditError, setInvEditError] = useState<string | null>(null);
  const [tempPasswordDialog, setTempPasswordDialog] = useState<StaffMember | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [tempPasswordSaving, setTempPasswordSaving] = useState(false);
  const [tempPasswordError, setTempPasswordError] = useState<string | null>(null);
  const [whatsappShare, setWhatsappShare] = useState<{
    invitation: PendingInvitation;
    step: "phone" | "ready";
    phone: string;
    phoneClean: string;
    acceptUrl: string;
    loading: boolean;
    error: string | null;
  } | null>(null);      // ============== WHATSAPP SHARE HANDLER ==============

  const handleWhatsAppShare = (invitation: PendingInvitation) => {
    setWhatsappShare({
      invitation,
      step: "phone",
      phone: "",
      phoneClean: "",
      acceptUrl: "",
      loading: false,
      error: null,
    });
  };

  const handleWhatsAppSubmitPhone = async () => {
    if (!whatsappShare) return;
    const phoneRaw = whatsappShare.phone.trim();
    if (!phoneRaw) {
      setWhatsappShare({ ...whatsappShare, error: "Phone number is required" });
      return;
    }

    setWhatsappShare({ ...whatsappShare, loading: true, error: null });

    try {
      // Use whatsappOnly=true so the API generates a fresh link without sending email
      const res = await fetch(`/api/invitations/${whatsappShare.invitation.id}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneRaw, whatsappOnly: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create invite link");
      }

      const data = await res.json();
      setWhatsappShare({
        ...whatsappShare,
        step: "ready",
        loading: false,
        acceptUrl: data.acceptUrl,
        phoneClean: phoneRaw.replace(/[^\d]/g, ""),
      });
    } catch (err) {
      setWhatsappShare({
        ...whatsappShare,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to create invite link",
      });
    }
  };

  // ============== COPY INVITE LINK HANDLER ==============

  const handleCopyInviteLink = async (inv: PendingInvitation) => {
    try {
      const res = await fetch(`/api/invitations/${inv.id}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappOnly: true }),
      });
      const data = await res.json();
      if (data.acceptUrl) {
        await navigator.clipboard.writeText(data.acceptUrl);
        setCopiedId(inv.id);
        toast.success("Invite link copied");
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        toast.error("Failed to generate invite link");
      }
    } catch {
      toast.error("Failed to generate invite link");
    }
  };

  // ============== DELETE / REVOKE INVITATION HANDLER ==============

  const handleRevokeInvitation = async (invId: string) => {
    setDeletingId(invId);
    try {
      const res = await fetch(`/api/invitations/${invId}/revoke`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke invitation");
      }
      toast.success("Invitation revoked");
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke invitation");
    } finally {
      setDeletingId(null);
    }
  };

  // ============== EDIT INVITATION HANDLER ==============

  const openEditInvitation = (inv: PendingInvitation) => {
    setEditInvitation(inv);
    setEditName(inv.name);
    setEditEmail(inv.email);
    setEditPhone(inv.phone || "");
    setInvEditRole(inv.role);
    setInvEditError(null);
  };

  const handleSaveEditInvitation = async () => {
    if (!editInvitation) return;
    setInvEditSaving(true);
    setInvEditError(null);
    try {
      const res = await fetch(`/api/invitations/${editInvitation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          role: invEditRole,
          phone: editPhone.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update invitation");
      }
      toast.success("Invitation updated");
      setEditInvitation(null);
      onUpdate();
    } catch (err) {
      setInvEditError(err instanceof Error ? err.message : "Failed to update invitation");
    } finally {
      setInvEditSaving(false);
    }
  };

  // ============== SEPARATE PILL STYLING ==============

  const [expandedId, setExpandedId] = useState<string | null>(null);

  /** Status dot indicator */
  const getStatusDot = (status: UserStatus) => {
    const colors: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: "bg-emerald-500",
      [UserStatus.INVITED]: "bg-amber-500",
      [UserStatus.SUSPENDED]: "bg-red-500",
      [UserStatus.DISABLED]: "bg-muted-foreground/40",
      [UserStatus.LOCKED]: "bg-red-500",
      [UserStatus.DELETED]: "bg-muted-foreground/30",
    };
    return (
      <span
        className={`inline-block h-2 w-2 rounded-full ${colors[status] || "bg-muted-foreground/40"}`}
        title={status}
      />
    );
  };

  /** Role pill — e.g. "OWNER" */
  const getRolePill = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      [UserRole.OWNER]: "bg-primary/15 text-primary border-primary/25",
      [UserRole.ADMIN]: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
      [UserRole.STAFF]: "bg-muted text-muted-foreground border-border",
    };
    return (
      <span className={`rounded-[3px] border px-1.5 py-[2px] text-[10px] font-bold leading-none select-none ${colors[role] || colors[UserRole.STAFF]}`}>
        {role}
      </span>
    );
  };

  /** Status pill — e.g. "ACTIVE" */
  const getStatusPill = (status: UserStatus) => {
    const colors: Record<UserStatus, string> = {
      [UserStatus.INVITED]: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
      [UserStatus.ACTIVE]: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      [UserStatus.SUSPENDED]: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
      [UserStatus.DISABLED]: "bg-muted text-muted-foreground border-border",
      [UserStatus.LOCKED]: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
      [UserStatus.DELETED]: "bg-muted text-muted-foreground line-through border-border",
    };
    return (
      <span className={`rounded-[3px] border px-1.5 py-[2px] text-[10px] font-bold leading-none select-none ${colors[status] || "bg-muted text-muted-foreground border-border"}`}>
        {status}
      </span>
    );
  };

  // ============== API HANDLERS ==============

  const handleStatusChange = async (id: string, newStatus: UserStatus) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      onUpdate();
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setLoadingId(null);
      setConfirmAction(null);
    }
  };

  const handleRevokeSessions = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/staff/${id}/sessions`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke sessions");
      }
      toast.success("All sessions revoked successfully");
      onUpdate();
    } catch (error) {
      console.error("Failed to revoke sessions:", error);
      toast.error(error instanceof Error ? error.message : "Failed to revoke sessions");
    } finally {
      setLoadingId(null);
      setConfirmAction(null);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }
      onUpdate();
      toast.success("Account deleted");
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setLoadingId(null);
      setConfirmAction(null);
    }
  };

  const handleSendPasswordReset = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/staff/${id}/send-password-reset`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send password reset");
      }
      toast.success("Password reset sent via email & WhatsApp");
    } catch (error) {
      console.error("Failed to send password reset:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send password reset");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRequirePasswordChange = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mustChangePassword: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to require password change");
      }
      toast.success("User will be required to change password on next login");
      onUpdate();
    } catch (error) {
      console.error("Failed to require password change:", error);
      toast.error(error instanceof Error ? error.message : "Failed to require password change");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReset2FA = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/staff/${id}/reset-2fa`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset 2FA");
      }
      toast.success("Two-factor authentication has been reset");
      onUpdate();
    } catch (error) {
      console.error("Failed to reset 2FA:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reset 2FA");
    } finally {
      setLoadingId(null);
    }
  };

  // ============== EDIT PERMISSIONS HANDLER ==============

  const openEditPermissions = (member: StaffMember) => {
    setEditingPermissions(member);
    setEditRole(member.role);
    const current = member.permissions as Permission[] | null;
    // Merge explicit permissions with role defaults for display
    const defaults = DEFAULT_ROLE_PERMISSIONS[member.role] || [];
    const merged = Array.from(new Set([...defaults, ...(current || [])]));
    setEditPerms(merged);
    setEditError(null);
  };

  const handleLoadRoleTemplate = () => {
    if (!editRole) return;
    setEditPerms(DEFAULT_ROLE_PERMISSIONS[editRole] || []);
  };

  const toggleEditPermission = (perm: Permission) => {
    setEditPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSavePermissions = async () => {
    if (!editingPermissions || !editRole) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/staff/${editingPermissions.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole, permissions: editPerms }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update permissions");
      }
      setEditingPermissions(null);
      onUpdate();
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setEditSaving(false);
    }
  };

  // ============== HELPERS ==============

  const canManage = (member: StaffMember) => {
    if (currentUserRole === UserRole.OWNER) return true;
    if (member.role === UserRole.OWNER) return false;
    if (currentUserRole === UserRole.ADMIN && member.role === UserRole.ADMIN) return false;
    return true;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ============== RENDER ==============

  return (
    <>
      <div>
      <div className="space-y-4">
        {staff.map((member) => (
          <div
            key={member.id}
            className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary font-bold text-lg">
                  {member.image ? (
                    <img src={member.image} alt={`${member.name} profile`} className="h-full w-full rounded-full object-cover" />
                  ) : member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-card bg-card">
                    {getStatusDot(member.status)}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-semibold text-foreground">
                      {member.name}
                    </h3>
                    {/* Separate role + status pills — closely spaced */}
                    {getRolePill(member.role)}
                    {getStatusPill(member.status)}
                    {member.twoFactorEnabled && (
                      <span className="inline-flex items-center rounded-[3px] border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-[2px] text-[9px] font-bold leading-none text-emerald-600 dark:text-emerald-400">
                        2FA
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {member.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last active: {formatDate(member.lastActiveAt)} | Created:{" "}
                    {formatDate(member.createdAt)}
                  </p>
                  {/* Quick permission chips */}
                  {member.permissions && member.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.permissions.slice(0, 5).map((p) => (
                        <span
                          key={p}
                          className="rounded-[3px] bg-muted px-1.5 py-[1px] text-[9px] font-semibold text-muted-foreground"
                        >
                          {p}
                        </span>
                      ))}
                      {member.permissions.length > 5 && (
                        <span className="rounded-[3px] bg-muted px-1.5 py-[1px] text-[9px] font-semibold text-muted-foreground">
                          +{member.permissions.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expandable inline permission editor */}
                  {expandedId === member.id && canManage(member) && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <QuickPermissionEditor
                        member={member}
                        currentUserRole={currentUserRole}
                        onSave={() => {
                          setExpandedId(null);
                          onUpdate();
                        }}
                        onCancel={() => setExpandedId(null)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {canManage(member) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={loadingId === member.id}>
                      {loadingId === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {/* === Permissions & Role Section === */}
                    <DropdownMenuItem onClick={() => openEditPermissions(member)}>
                      <Key className="mr-2 h-4 w-4" />
                      Edit Role &amp; Permissions
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setExpandedId(expandedId === member.id ? null : member.id)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {expandedId === member.id ? "Close Quick Permissions" : "Quick Permissions"}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* === Status Section === */}
                    {/* Resend Invitation needs invitation ID — not available here */}

                    {member.status === UserStatus.ACTIVE && (
                      <DropdownMenuItem
                        onClick={() => setConfirmAction({ type: "suspend", member })}
                        className="text-warning"
                      >
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Suspend
                      </DropdownMenuItem>
                    )}

                    {member.status === UserStatus.SUSPENDED && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(member.id, UserStatus.ACTIVE)}
                        className="text-success"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Activate
                      </DropdownMenuItem>
                    )}

                    {member.status === UserStatus.ACTIVE && (
                      <DropdownMenuItem
                        onClick={() => setConfirmAction({ type: "disable", member })}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Disable
                      </DropdownMenuItem>
                    )}

                    {member.status === UserStatus.DISABLED && (
                      <DropdownMenuItem
                        onClick={() => setConfirmAction({ type: "reactivate", member })}
                        className="text-success"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Reactivate
                      </DropdownMenuItem>
                    )}

                    {member.status === UserStatus.LOCKED && (
                      <DropdownMenuItem
                        onClick={() => setConfirmAction({ type: "unlock", member })}
                        className="text-success"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Unlock Account
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {/* === Security Section === */}
                    <DropdownMenuItem onClick={() => handleSendPasswordReset(member.id)}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Password Reset
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleRequirePasswordChange(member.id)}>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Force Password Change
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => { setTempPasswordDialog(member); setTempPassword(""); setTempPasswordError(null); }}>
                      <Key className="mr-2 h-4 w-4" />
                      Set Temporary Password
                    </DropdownMenuItem>

                    {member.twoFactorEnabled && (
                      <DropdownMenuItem
                        onClick={() => handleReset2FA(member.id)}
                        className="text-warning"
                      >
                        <Smartphone className="mr-2 h-4 w-4" />
                        Reset 2FA
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={() => setConfirmAction({ type: "revoke-sessions", member })}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Revoke Sessions
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* === Destructive Section === */}
                    <DropdownMenuItem
                      onClick={() => setConfirmAction({ type: "delete", member })}
                      className="text-destructive font-medium"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ============== PENDING INVITATIONS ============== */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Invitations
            </h3>
            <span className="rounded-full bg-amber-200 dark:bg-amber-800/50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-600 shadow-sm">
              {pendingInvitations.length}
            </span>
          </div>
          {pendingInvitations.map((inv) => (              <div
              key={inv.id}
              className="rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-4 transition-all hover:shadow-sm hover:border-amber-400 dark:hover:border-amber-600"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800/40 text-amber-900 dark:text-amber-200 font-extrabold text-base border-2 border-amber-400 dark:border-amber-600 shadow-sm">
                    {inv.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{inv.name}</span>
                      <span className="rounded-[4px] border border-amber-400 dark:border-amber-600 bg-amber-200 dark:bg-amber-800/40 px-2 py-[3px] text-[10px] font-extrabold leading-none text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                        PENDING
                      </span>
                      <span className={`rounded-[3px] border px-1.5 py-[2px] text-[10px] font-bold leading-none select-none ${
                        inv.role === UserRole.ADMIN
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25"
                          : "bg-muted text-muted-foreground border-border"
                      }`}>
                        {inv.role}
                      </span>
                      {inv.phone && (
                        <span className="rounded-[3px] border border-green-500/20 bg-green-500/10 px-1.5 py-[2px] text-[10px] font-bold leading-none text-green-600 dark:text-green-400">
                          WhatsApp
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{inv.email}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                      {inv.invitedBy && (
                        <span>Invited by {inv.invitedBy.name}</span>
                      )}
                      <span>Created {new Date(inv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span>Expires {new Date(inv.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleWhatsAppShare(inv)}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={resendingId === inv.id}
                      onClick={async () => {
                        setResendingId(inv.id);
                        try {
                          const res = await fetch(`/api/invitations/${inv.id}/resend`, { method: "POST" });
                          let apiError: string | null = null;
                          let apiMessage: string | null = null;
                          try {
                            const body = await res.json();
                            if (body?.error) apiError = body.error;
                            if (body?.message) apiMessage = body.message;
                          } catch {}
                          if (!res.ok) {
                            toast.error(apiError || "The invitation email could not be sent. Please try again.");
                            return;
                          }
                          toast.success(apiMessage || "Invitation email resent successfully.");
                          onUpdate();
                        } catch {
                          toast.error("The invitation email could not be sent. Please try again.");
                        } finally {
                          setResendingId(null);
                        }
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Resend Email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleCopyInviteLink(inv)}>
                      {copiedId === inv.id ? (
                        <Check className="mr-2 h-4 w-4 text-success" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      {copiedId === inv.id ? "Copied!" : "Copy Link"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditInvitation(inv)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleRevokeInvitation(inv.id)}
                      className="text-destructive"
                      disabled={deletingId === inv.id}
                    >
                      {deletingId === inv.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      {deletingId === inv.id ? "Revoking..." : "Revoke"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* ============== CONFIRMATION DIALOG ============== */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "suspend" && "Suspend Account"}
              {confirmAction?.type === "activate" && "Activate Account"}
              {confirmAction?.type === "disable" && "Disable Account"}
              {confirmAction?.type === "reactivate" && "Reactivate Account"}
              {confirmAction?.type === "unlock" && "Unlock Account"}
              {confirmAction?.type === "revoke-sessions" && "Revoke All Sessions"}
              {confirmAction?.type === "delete" && "Delete Account"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "suspend" &&
                `Are you sure you want to suspend ${confirmAction.member.name}'s account? They will be logged out immediately and unable to access the dashboard.`}
              {confirmAction?.type === "activate" &&
                `Are you sure you want to activate ${confirmAction.member.name}'s account?`}
              {confirmAction?.type === "disable" &&
                `Are you sure you want to disable ${confirmAction.member.name}'s account? They will lose all dashboard access.`}
              {confirmAction?.type === "reactivate" &&
                `Are you sure you want to reactivate ${confirmAction.member.name}'s account? They will regain access to the dashboard.`}
              {confirmAction?.type === "unlock" &&
                `${confirmAction.member.name}'s account has been locked due to failed sign-in attempts. Are you sure you want to unlock it? They will be able to sign in again.`}
              {confirmAction?.type === "revoke-sessions" &&
                `Revoke all active sessions for ${confirmAction.member.name}? They will be logged out of all devices.`}
              {confirmAction?.type === "delete" &&
                `Are you sure you want to permanently delete ${confirmAction.member.name}'s account (${confirmAction.member.email})? This action cannot be undone. The user will be completely removed from the system.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.type === "revoke-sessions") {
                  handleRevokeSessions(confirmAction.member.id);
                } else if (confirmAction.type === "delete") {
                  handleDeleteAccount(confirmAction.member.id);
                } else {
                  handleStatusChange(
                    confirmAction.member.id,
                    confirmAction.type === "suspend"
                      ? UserStatus.SUSPENDED
                      : confirmAction.type === "activate" ||
                        confirmAction.type === "reactivate" ||
                        confirmAction.type === "unlock"
                      ? UserStatus.ACTIVE
                      : UserStatus.DISABLED
                  );
                }
              }}
              className={
                confirmAction?.type === "disable" || confirmAction?.type === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmAction?.type === "delete" ? "Delete Account" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============== EDIT ROLE & PERMISSIONS DIALOG ============== */}
      <Dialog
        open={editingPermissions !== null}
        onOpenChange={(open) => {
          if (!open) setEditingPermissions(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Role &amp; Permissions
            </DialogTitle>
            <DialogDescription>
              {editingPermissions ? (
                <>Manage role and permissions for <strong>{editingPermissions.name}</strong></>
              ) : (
                "Manage role and permissions for the user"
              )}
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {editError}
            </div>
          )}

          <div className="space-y-4">
            {/* Role selector */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editRole ?? undefined}
                onValueChange={(r) => {
                  setEditRole(r as UserRole);
                  // Auto-load role template
                  setEditPerms(DEFAULT_ROLE_PERMISSIONS[r as UserRole] || []);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  {currentUserRole === UserRole.OWNER && (
                    <SelectItem value={UserRole.OWNER}>Owner</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Changing the role will reload the permission template. Customize individual permissions below.
              </p>
            </div>

            {/* Current role template indicator */}
            <button
              type="button"
              onClick={handleLoadRoleTemplate}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              ↻ Reset to {editRole} defaults
            </button>

            {/* Permission groups */}
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Permissions</span>
                <span className="text-xs text-muted-foreground">
                  {editPerms.length} selected
                </span>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {PERMISSION_GROUPS.map((group) => {
                  // Hide sensitive groups for non-OWNER editors
                  const sensitiveGroups = ["Users", "Payments"];
                  if (
                    currentUserRole !== UserRole.OWNER &&
                    sensitiveGroups.includes(group.label)
                  ) {
                    const visiblePerms = group.permissions.filter((p) =>
                      editPerms.includes(p.key)
                    );
                    if (visiblePerms.length === 0) return null;
                    return (
                      <div key={group.label} className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">{group.label}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {visiblePerms.map((perm) => (
                            <span
                              key={perm.key}
                              className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground"
                            >
                              {perm.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={group.label} className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{group.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.permissions.map((perm) => {
                          const isSelected = editPerms.includes(perm.key);

                          const isOwnerOnlyPermission =
                            currentUserRole !== UserRole.OWNER &&
                            perm.key === Permissions.USERS_DELETE;

                          const financialPerms = [
                            Permissions.PAYMENTS_VIEW,
                            Permissions.PAYMENTS_CREATE,
                            Permissions.PAYMENTS_UPDATE,
                            Permissions.PAYMENTS_REFUND,
                            Permissions.PAYMENTS_EXPORT,
                            Permissions.DASHBOARD_VIEW_FINANCIAL_SUMMARY,
                          ] as const;
                          const isFinancialRestricted =
                            currentUserRole !== UserRole.OWNER &&
                            (financialPerms as readonly string[]).includes(perm.key);

                          const isDisabled = isOwnerOnlyPermission || isFinancialRestricted;

                          if (isDisabled) {
                            return (
                              <span
                                key={perm.key}
                                className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                                  isSelected
                                    ? "bg-muted text-muted-foreground/50 border border-dashed border-muted-foreground/20"
                                    : "bg-muted text-muted-foreground/40 border border-transparent"
                                } cursor-not-allowed`}
                                title={
                                  isOwnerOnlyPermission
                                    ? "Only the Owner can assign this permission"
                                    : "Only the Owner can grant financial access"
                                }
                              >
                                {perm.label}
                              </span>
                            );
                          }

                          return (
                            <button
                              key={perm.key}
                              type="button"
                              onClick={() => toggleEditPermission(perm.key)}
                              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                                isSelected
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                              }`}
                            >
                              {isSelected && <Check className="inline h-3 w-3 mr-0.5" />}
                              {perm.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setEditingPermissions(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSavePermissions} disabled={editSaving}>
                {editSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============== WHATSAPP SHARE DIALOG ============== */}
      <Dialog
        open={whatsappShare !== null}
        onOpenChange={(open) => {
          if (!open) setWhatsappShare(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {whatsappShare?.step === "ready" ? "Share on WhatsApp" : "Share Invitation via WhatsApp"}
            </DialogTitle>
            <DialogDescription>
              {whatsappShare?.step === "ready"
                ? `Send the invite link to ${whatsappShare?.invitation.name} via your own WhatsApp`
                : `Enter the phone number for ${whatsappShare?.invitation.name}`}
            </DialogDescription>
          </DialogHeader>

          {whatsappShare?.step === "phone" && (
            <div className="space-y-4">
              {whatsappShare.error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {whatsappShare.error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="wa-share-phone">Phone Number</Label>
                <Input
                  id="wa-share-phone"
                  value={whatsappShare.phone}
                  onChange={(e) => setWhatsappShare({ ...whatsappShare, phone: e.target.value })}
                  placeholder="e.g. +264 81 123 4567"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setWhatsappShare(null)}>
                  Cancel
                </Button>
                <Button onClick={handleWhatsAppSubmitPhone} disabled={whatsappShare.loading}>
                  {whatsappShare.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Get Invite Link
                </Button>
              </div>
            </div>
          )}

          {whatsappShare?.step === "ready" && (
            <div className="space-y-4 text-center py-4">
              <Check className="mx-auto h-8 w-8 text-success" />
              <p className="text-sm text-muted-foreground">
                Invite link ready! Share it with {whatsappShare.invitation.name}:
              </p>
              <a
                href={buildWhatsAppUrl(whatsappShare.phoneClean, `Hi ${whatsappShare.invitation.name}, you've been invited to join the ${storeName} dashboard as ${whatsappShare.invitation.role}. Accept your secure invite here: ${whatsappShare.acceptUrl}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md active:translate-y-0"
              >
                <MessageCircle className="h-4 w-4" />
                Share on WhatsApp
              </a>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(whatsappShare.acceptUrl);
                    toast.success("Invite link copied");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  Copy invite link
                </button>
                <span className="text-xs text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={() => setWhatsappShare(null)}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============== EDIT INVITATION DIALOG ============== */}
      <Dialog
        open={editInvitation !== null}
        onOpenChange={(open) => {
          if (!open) setEditInvitation(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Invitation</DialogTitle>
            <DialogDescription>
              Update invitation details for {editInvitation?.name}
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {editError}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone / WhatsApp</Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="e.g. +264 81 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={invEditRole}
                onValueChange={(r) => setInvEditRole(r)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  {currentUserRole === UserRole.OWNER && (
                    <SelectItem value={UserRole.OWNER}>Owner</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setEditInvitation(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditInvitation} disabled={invEditSaving}>
                {invEditSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============== SET TEMPORARY PASSWORD DIALOG ============== */}
      <Dialog
        open={tempPasswordDialog !== null}
        onOpenChange={(open) => {
          if (!open) { setTempPasswordDialog(null); setTempPassword(""); setTempPasswordError(null); }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Temporary Password</DialogTitle>
            <DialogDescription>
              Set a temporary password for <strong>{tempPasswordDialog?.name}</strong>.
              The user will be required to change it on next login.
            </DialogDescription>
          </DialogHeader>

          {tempPasswordError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{tempPasswordError}</div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="temp-password">Temporary Password</Label>
              <Input
                id="temp-password"
                type="password"
                minLength={10}
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Minimum 10 characters"
                required
              />
              <p className="text-xs text-warning flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Use this only when the user cannot receive password reset emails.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => { setTempPasswordDialog(null); setTempPassword(""); setTempPasswordError(null); }}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!tempPasswordDialog || tempPassword.length < 10) {
                    setTempPasswordError("Password must be at least 10 characters");
                    return;
                  }
                  setTempPasswordSaving(true);
                  setTempPasswordError(null);
                  try {
                    const res = await fetch(`/api/staff/${tempPasswordDialog.id}/set-temporary-password`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ password: tempPassword }),
                    });
                    if (!res.ok) {
                      const data = await res.json();
                      throw new Error(data.error || "Failed to set password");
                    }
                    toast.success("Temporary password set. User must change on next login.");
                    setTempPasswordDialog(null);
                    setTempPassword("");
                    onUpdate();
                  } catch (err) {
                    setTempPasswordError(err instanceof Error ? err.message : "Failed to set password");
                  } finally {
                    setTempPasswordSaving(false);
                  }
                }}
                disabled={tempPasswordSaving}
              >
                {tempPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Key className="mr-2 h-4 w-4" />
                Set Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
