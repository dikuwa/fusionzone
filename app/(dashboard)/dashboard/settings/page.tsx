"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Save,
  Building2,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  CreditCard,
  ImageIcon,
  Heading,
  FileText,
  Plus,
  X,
  Check,
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pencil,
  Banknote,
  ArrowUp,
  ArrowDown,
  LockKeyhole,
  User,
  Shield,
  ShieldOff,
  Smartphone,
  KeyRound,
  History,
  Monitor,
  LogOut,
  QrCode,
  Copy,
  AlertCircle,
  Menu,
} from "lucide-react";
import { useDashboardStore } from "@/lib/store/dashboard";
import { cn, decodeHTMLEntities } from "@/lib/utils";
import type { BankDetail, ContactDetail, PaymentMethod } from "@/lib/dashboard-data";
import { Permissions } from "@/lib/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isForceChange = searchParams.get("forceChange") === "true";
  const settings = useDashboardStore((s) => s.settings);
  const contactDetails = useDashboardStore((s) => s.contactDetails);
  const bankDetails = useDashboardStore((s) => s.bankDetails);
  const paymentMethods = useDashboardStore((s) => s.paymentMethods);
  const updateSettings = useDashboardStore((s) => s.updateSettings);
  const addContactDetail = useDashboardStore((s) => s.addContactDetail);
  const updateContactDetail = useDashboardStore((s) => s.updateContactDetail);
  const deleteContactDetail = useDashboardStore((s) => s.deleteContactDetail);
  const addBankDetail = useDashboardStore((s) => s.addBankDetail);
  const updateBankDetail = useDashboardStore((s) => s.updateBankDetail);
  const deleteBankDetail = useDashboardStore((s) => s.deleteBankDetail);
  const addPaymentMethod = useDashboardStore((s) => s.addPaymentMethod);
  const updatePaymentMethod = useDashboardStore((s) => s.updatePaymentMethod);
  const deletePaymentMethod = useDashboardStore((s) => s.deletePaymentMethod);
  const movePaymentMethod = useDashboardStore((s) => s.movePaymentMethod);
  const moveContactDetail = useDashboardStore((s) => s.moveContactDetail);
  const moveBankDetail = useDashboardStore((s) => s.moveBankDetail);
  const navOrder = useDashboardStore((s) => s.navOrder);
  const setNavOrder = useDashboardStore((s) => s.setNavOrder);

  const NAV_ITEM_LABELS: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/orders": "Orders",
    "/dashboard/products": "Products",
    "/dashboard/categories": "Categories & Brands",
    "/dashboard/promotions": "Promotions",
    "/dashboard/customers": "Customers",
    "/dashboard/follow-ups": "Follow-ups",
    "/dashboard/receipts": "Receipts",
    "/dashboard/quotations": "Quotations",
    "/dashboard/notifications": "Notifications",
    "/dashboard/back-in-stock": "Stock Requests",
  };

  const moveNavItem = (href: string, direction: "up" | "down") => {
    const idx = navOrder.indexOf(href);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= navOrder.length) return;
    const newOrder = [...navOrder];
    [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];
    setNavOrder(newOrder);
  };

  const [userSession, setUserSession] = useState<{
    name: string;
    email: string;
    role: string;
    status: string;
    jobTitle?: string;
    phone?: string;
    profileImage?: string;
    twoFactorEnabled?: boolean;
    permissions?: string[];
    lastActiveAt?: string;
    createdAt?: string;
  } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/get-session")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user) {
          setUserSession({
            name: data.user.name || "User",
            email: data.user.email || "",
            role: data.user.role || "STAFF",
            status: data.user.status || "ACTIVE",
            jobTitle: data.user.jobTitle || undefined,
            phone: data.user.phone || undefined,
            profileImage: data.user.image || "",
            twoFactorEnabled: data.user.twoFactorEnabled || false,
            permissions: data.user.permissions || [],
            lastActiveAt: data.user.lastActiveAt || undefined,
            createdAt: data.user.createdAt || undefined,
          });
          // Initialize profile form from session data
          setProfileForm({
            displayName: data.user.name || "",
            contactNumber: data.user.phone || "",
            profileEmail: data.user.profileEmail || data.user.email || "",
            profileImage: data.user.image || "",
            jobTitle: data.user.jobTitle || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setSessionLoading(false));
  }, []);

  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(settings);
  useEffect(() => setForm(settings), [settings]);

  const [uploading, setUploading] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    contactNumber: "",
    profileEmail: "",
    profileImage: "",
    jobTitle: "",
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [tfaState, setTfaState] = useState<{
    step: "idle" | "password" | "setup" | "done";
    qrCode?: string;
    secret?: string;
    backupCodes?: string[];
    error?: string;
    saving?: boolean;
  }>({ step: "idle" });
  const [tfaPassword, setTfaPassword] = useState("");
  const [tfaCode, setTfaCode] = useState("");
  const [tfaMessage, setTfaMessage] = useState<string | null>(null);
  const [disable2FAOpen, setDisable2FAOpen] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);
  const heroImageInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  // Contact detail form
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ type: "phone" as ContactDetail["type"], label: "", value: "", isActive: true });
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  // Bank detail form
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({ bankName: "", accountName: "", accountNumber: "", branchCode: "", isActive: true });
  const [editingBankId, setEditingBankId] = useState<string | null>(null);

  // Payment method form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ name: "", type: "BankTransfer" as PaymentMethod["type"], details: "", instructions: "", isActive: true });
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          contactDetails,
          bankDetails,
          paymentMethods,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.settings) throw new Error(data.error || "Could not save settings.");
      updateSettings(data.settings);
      setForm(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("[Settings] Failed to persist to DB:", err);
      toast.error(err instanceof Error ? err.message : "Could not save settings.");
    }
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          revokeOtherSessions: true,
        }),
      });
      // Defensive JSON parsing
      const contentType = response.headers.get("content-type");
      const data = contentType?.includes("application/json") ? await response.json() : null;
      if (!response.ok) throw new Error(data?.message || data?.error || "Could not change password");

      // Clear mustChangePassword flag
      try {
        await fetch("/api/auth/clear-must-change-password", { method: "POST" });
      } catch { /* non-blocking */ }

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage("Password changed successfully. Other sessions were revoked.");

      // If user was redirected here to change password, redirect to dashboard
      if (isForceChange) {
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "Could not change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({
      ...prev,
      [field]: field === "lowStockThreshold" ? Number.parseInt(value, 10) || 0 : value,
    }));

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("context", "settings");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setForm((prev) => ({ ...prev, heroImageUrl: data.url }));
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (heroImageInputRef.current) heroImageInputRef.current.value = "";
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("context", "profile");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setProfileForm((prev) => ({ ...prev, profileImage: data.url }));
        toast.success("Profile image uploaded");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Failed to upload image");
    } finally {
      setProfileUploading(false);
      if (profileImageInputRef.current) profileImageInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.displayName,
          phone: profileForm.contactNumber,
          profileEmail: profileForm.profileEmail,
          profileImage: profileForm.profileImage,
          jobTitle: profileForm.jobTitle,
        }),
      });

      // Defensive JSON parsing — check content type before calling .json()
      const contentType = res.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await res.json()
        : null;

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to update profile");
      }

      // Update local session state from server response
      setUserSession((prev) => prev ? {
        ...prev,
        name: data?.user?.displayName || profileForm.displayName,
        email: data?.user?.email || prev.email,
        phone: data?.user?.contactNumber || profileForm.contactNumber,
        profileImage: data?.user?.profileImage || profileForm.profileImage || prev.profileImage,
        jobTitle: data?.user?.jobTitle || profileForm.jobTitle,
      } : prev);

      // Re-initialize profile form from server response for accuracy
      if (data?.user) {
        setProfileForm({
          displayName: data.user.displayName || profileForm.displayName,
          contactNumber: data.user.contactNumber || profileForm.contactNumber,
          profileEmail: data.user.profileEmail || data.user.email || profileForm.profileEmail,
          profileImage: data.user.profileImage || profileForm.profileImage,
          jobTitle: data.user.jobTitle || profileForm.jobTitle,
        });
      }
      setIsEditingProfile(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const isFirstContact = (id: string) => contactDetails.findIndex(c => c.id === id) === 0;
  const isLastContact = (id: string) => contactDetails.findIndex(c => c.id === id) === contactDetails.length - 1;
  const isFirstBank = (id: string) => bankDetails.findIndex(b => b.id === id) === 0;
  const isLastBank = (id: string) => bankDetails.findIndex(b => b.id === id) === bankDetails.length - 1;
  const isFirstPayment = (id: string) => paymentMethods.findIndex(p => p.id === id) === 0;
  const isLastPayment = (id: string) => paymentMethods.findIndex(p => p.id === id) === paymentMethods.length - 1;

  const resetContactForm = () =>
    setContactForm({ type: "phone", label: "", value: "", isActive: true });

  const handleAddContact = () => {
    if (!contactForm.label.trim() || !contactForm.value.trim()) return;
    if (editingContactId) {
      updateContactDetail(editingContactId, contactForm);
      setEditingContactId(null);
    } else {
      addContactDetail(contactForm);
    }
    resetContactForm();
    setShowContactForm(false);
  };

  const startEditContact = (cd: ContactDetail) => {
    setContactForm({ type: cd.type, label: cd.label, value: cd.value, isActive: cd.isActive });
    setEditingContactId(cd.id);
    setShowContactForm(true);
  };

  const resetBankForm = () =>
    setBankForm({ bankName: "", accountName: "", accountNumber: "", branchCode: "", isActive: true });

  const handleAddBank = () => {
    if (!bankForm.bankName.trim() || !bankForm.accountName.trim() || !bankForm.accountNumber.trim()) return;
    if (editingBankId) {
      updateBankDetail(editingBankId, bankForm);
      setEditingBankId(null);
    } else {
      addBankDetail(bankForm);
    }
    resetBankForm();
    setShowBankForm(false);
  };

  const startEditBank = (bd: BankDetail) => {
    setBankForm({ bankName: bd.bankName, accountName: bd.accountName, accountNumber: bd.accountNumber, branchCode: bd.branchCode, isActive: bd.isActive });
    setEditingBankId(bd.id);
    setShowBankForm(true);
  };

  const resetPaymentForm = () =>
    setPaymentForm({ name: "", type: "BankTransfer", details: "", instructions: "", isActive: true });

  const handleAddPayment = () => {
    if (!paymentForm.name.trim() || !paymentForm.details.trim()) return;
    if (editingPaymentId) {
      updatePaymentMethod(editingPaymentId, paymentForm);
      setEditingPaymentId(null);
    } else {
      addPaymentMethod(paymentForm);
    }
    resetPaymentForm();
    setShowPaymentForm(false);
  };

  const startEditPayment = (pm: PaymentMethod) => {
    setPaymentForm({ name: pm.name, type: pm.type, details: pm.details, instructions: pm.instructions || "", isActive: pm.isActive });
    setEditingPaymentId(pm.id);
    setShowPaymentForm(true);
  };

  // Determine which tabs to show based on role
  // OWNER: all tabs
  // ADMIN: store management tabs only if SETTINGS_UPDATE permission is granted
  // STAFF: only Account and Security (no store management)
  const userRole = userSession?.role;
  const userPermissions = userSession?.permissions ?? [];
  type TabId = "store" | "hero" | "contact" | "banking" | "payment-methods" | "security" | "account";
  const storeManagementTabs: TabId[] = ["store", "hero", "contact", "banking", "payment-methods"];
  const personalTabs: TabId[] = ["security", "account"];
  const allTabs: { id: TabId; label: string; icon: any }[] = [
    { id: "account", label: "Account", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "store", label: "Store", icon: Building2 },
    { id: "hero", label: "Hero", icon: ImageIcon },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "banking", label: "Banking", icon: CreditCard },
    { id: "payment-methods", label: "Payments", icon: Banknote },
  ];
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const tabs = allTabs.filter((tab) => {
    // Staff: only personal tabs
    if (userRole === "STAFF") return personalTabs.includes(tab.id);
    // Admin: store tabs only if they have SETTINGS_UPDATE permission
    if (userRole === "ADMIN" && storeManagementTabs.includes(tab.id)) {
      // Owner grants store access by assigning SETTINGS_UPDATE to the Admin
      return userPermissions.includes(Permissions.SETTINGS_UPDATE);
    }
    // OWNER & everyone else: all tabs
    return true;
  });

  // If active tab is filtered out, switch to first available tab
  useEffect(() => {
    if (!userSession) return;
    if (tabs.length > 0 && !tabs.find((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [userSession?.role, userSession?.permissions, activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage store info, hero section, contacts, and payment methods.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        {!userSession && sessionLoading ? (
          <div className="flex gap-1.5 p-1">
            <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Force password change banner */}
      {isForceChange && (
        <div className="rounded-xl border border-warning/30 bg-warning-soft p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Password Change Required</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Your account was created with a temporary password. Please set a new password before accessing the dashboard.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* === SECURITY TAB (2FA Management) === */}
        {activeTab === "security" && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Security</h2>
            </div>

            {/* 2FA Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <Badge variant="outline" className={userSession?.twoFactorEnabled ? "bg-success/10 text-success border-success/20 text-[10px] font-bold" : "bg-muted text-muted-foreground text-[10px] font-bold"}>
                  {userSession?.twoFactorEnabled ? "Enabled" : "Not Enabled"}
                </Badge>
              </div>

              {tfaMessage && (
                <p className="text-xs text-muted-foreground">{tfaMessage}</p>
              )}

              {/* Password confirmation step before enabling 2FA */}
              {tfaState.step === "password" && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">Confirm your password to enable 2FA</p>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={tfaPassword}
                    onChange={(e) => setTfaPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  {tfaState.error && (
                    <p className="text-xs text-destructive">{tfaState.error}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!tfaPassword) return;
                        setTfaState((s) => ({ ...s, saving: true, error: undefined }));
                        try {
                          const res = await fetch("/api/auth/two-factor/enable", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ password: tfaPassword }),
                          });
                          // Defensive JSON parsing
                          const contentType = res.headers.get("content-type");
                          const data = contentType?.includes("application/json") ? await res.json() : null;
                          if (!res.ok) {
                            throw new Error(data?.message || data?.error || "Failed to enable 2FA");
                          }
                          setTfaState({
                            step: "setup",
                            qrCode: data?.totpQR || data?.qrCode || data?.data?.totpQR || "",
                            secret: data?.secret || data?.data?.secret || "",
                            backupCodes: data?.backupCodes || data?.data?.backupCodes || [],
                          });
                          setTfaCode("");
                          setTfaPassword("");
                        } catch (err) {
                          setTfaState((s) => ({ ...s, saving: false, error: err instanceof Error ? err.message : "Failed" }));
                        }
                      }}
                      disabled={!tfaPassword || tfaState.saving}
                      className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {tfaState.saving ? "Setting up..." : "Continue"}
                    </button>
                    <button
                      onClick={() => {
                        setTfaState({ step: "idle" });
                        setTfaPassword("");
                        setTfaCode("");
                      }}
                      className="h-9 rounded-lg border border-border px-4 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* 2FA setup flow — QR code + backup codes + TOTP verify */}
              {tfaState.step === "setup" && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                  <p className="text-sm font-medium text-foreground">Scan this QR code with your authenticator app</p>
                  {tfaState.qrCode && (
                    <div className="flex justify-center">
                      <img src={tfaState.qrCode} alt="TOTP QR Code" className="h-40 w-40 rounded-lg border border-border" />
                    </div>
                  )}
                  {tfaState.secret && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Or enter this secret manually:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] font-mono select-all">{tfaState.secret}</code>
                        <button
                          onClick={() => navigator.clipboard.writeText(tfaState.secret!)}
                          className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  {tfaState.backupCodes && tfaState.backupCodes.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">
                        Backup codes — save these safely. Each code can be used once.
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {tfaState.backupCodes.map((code, i) => (
                          <code key={i} className="rounded border border-border bg-background px-2 py-0.5 text-[10px] font-mono">
                            {code}
                          </code>
                        ))}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(tfaState.backupCodes!.join("\n"))}
                        className="mt-1 text-[11px] text-primary hover:text-primary/80"
                      >
                        <Copy className="inline h-3 w-3 mr-1" />
                        Copy all codes
                      </button>
                    </div>
                  )}

                  {/* Verify TOTP code to complete setup */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">Verify by entering a code from your authenticator app:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={tfaCode}
                        onChange={(e) => setTfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="h-9 w-28 rounded-lg border border-border bg-background px-3 text-sm font-mono text-center tracking-widest focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        maxLength={6}
                      />
                      <button
                        onClick={async () => {
                          if (tfaCode.length < 6) return;
                          setTfaState((s) => ({ ...s, saving: true, error: undefined }));
                          try {
                            const res = await fetch("/api/auth/two-factor/verify", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ code: tfaCode }),
                            });
                            // Defensive JSON parsing
                            const contentType = res.headers.get("content-type");
                            const data = contentType?.includes("application/json") ? await res.json() : null;
                            if (!res.ok) {
                              throw new Error(data?.message || data?.error || "Verification failed");
                            }
                            setTfaState({ step: "done" });
                            setTfaMessage("Two-factor authentication has been enabled.");
                            // Refresh session data
                            const sessionRes = await fetch("/api/auth/get-session");
                            if (sessionRes.ok) {
                              const sessionData = await sessionRes.json();
                              if (sessionData?.user) {
                                setUserSession((prev) => prev ? { ...prev, twoFactorEnabled: true } : prev);
                              }
                            }
                          } catch (err) {
                            setTfaState((s) => ({ ...s, error: err instanceof Error ? err.message : "Verification failed", saving: false }));
                          }
                        }}
                        disabled={tfaCode.length < 6 || tfaState.saving}
                        className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {tfaState.saving ? "Verifying..." : "Verify & Enable"}
                      </button>
                    </div>
                    {tfaState.error && (
                      <p className="text-xs text-destructive">{tfaState.error}</p>
                    )}
                  </div>
                </div>
              )}

              {tfaState.step === "done" && (
                <p className="text-xs text-success">2FA is now active on your account.</p>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {!userSession?.twoFactorEnabled && tfaState.step === "idle" && (
                  <button
                    onClick={() => {
                      setTfaState({ step: "password" });
                      setTfaPassword("");
                      setTfaCode("");
                      setTfaMessage(null);
                    }}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <QrCode className="mr-1.5 h-3.5 w-3.5 inline" />
                    Enable 2FA
                  </button>
                )}
                {userSession?.twoFactorEnabled && (
                  <>
                    <button
                      onClick={() => setDisable2FAOpen(true)}
                      className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <ShieldOff className="mr-1.5 h-3.5 w-3.5 inline" />
                      Disable 2FA
                    </button>
                    <AlertDialog open={disable2FAOpen} onOpenChange={setDisable2FAOpen}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will reduce the security of your account. You will no longer need
                            a verification code from your authenticator app when signing in.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={disabling2FA}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            disabled={disabling2FA}
                            onClick={async (e) => {
                              e.preventDefault();
                              setDisabling2FA(true);
                              try {
                                const res = await fetch("/api/auth/two-factor/disable", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                });
                                // Defensive JSON parsing
                                const contentType = res.headers.get("content-type");
                                const data = contentType?.includes("application/json") ? await res.json() : null;
                                if (!res.ok) {
                                  throw new Error(data?.message || data?.error || "Failed to disable 2FA");
                                }
                                setTfaState({ step: "idle" });
                                toast.success("Two-factor authentication has been disabled.");
                                setUserSession((prev) => prev ? { ...prev, twoFactorEnabled: false } : prev);
                                setDisable2FAOpen(false);
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Failed to disable 2FA");
                              } finally {
                                setDisabling2FA(false);
                              }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {disabling2FA ? "Disabling..." : "Yes, Disable"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === STORE TAB === */}
        {activeTab === "store" && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Store Information</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">Store Name</label>
                <input
                  value={form.storeName}
                  onChange={(e) => updateField("storeName", e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+264 85 277 5140"
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">Primary phone displayed in header &amp; hero CTA.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">WhatsApp Number</label>
                <input
                  value={form.whatsapp}
                  onChange={(e) => updateField("whatsapp", e.target.value)}
                  placeholder="264852775140"
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">Without + prefix. Used in WhatsApp links across all pages.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="sales@desertechnam.com"
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Receipt Prefix</label>
                <input
                  value={form.receiptPrefix}
                  onChange={(e) => updateField("receiptPrefix", e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Low Stock Threshold</label>
                <input
                  value={form.lowStockThreshold}
                  onChange={(e) => updateField("lowStockThreshold", e.target.value)}
                  type="number"
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Currency</label>
                <input value={form.currency} disabled className="mt-1.5 h-11 w-full rounded-lg border border-border bg-muted px-3 text-sm" />
              </div>
            </div>

            {/* Navigation Order */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 pb-3">
                <Menu className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Sidebar Navigation Order</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Drag sidebar items or use arrows to reorder. Changes apply immediately.</p>
              <div className="space-y-1.5 max-w-md">
                {navOrder.map((href, idx) => {
                  const label = NAV_ITEM_LABELS[href];
                  if (!label) return null;
                  return (
                    <div
                      key={href}
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <Menu className="h-3.5 w-3.5 text-muted-foreground/40" />
                        <span className="text-xs font-medium text-foreground">{label}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => moveNavItem(href, "up")}
                          disabled={idx === 0}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-20 disabled:pointer-events-none"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveNavItem(href, "down")}
                          disabled={idx === navOrder.length - 1}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-20 disabled:pointer-events-none"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* === HERO TAB === */}
        {activeTab === "hero" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <ImageIcon className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Hero Section</h2>
              </div>

              {/* Hero Image */}
              <div>
                <label className="text-sm font-medium text-foreground">Hero Background Image</label>
                <div className="mt-2 flex items-start gap-4">
                  <div className="relative h-32 w-56 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {form.heroImageUrl ? (
                      <img
                        src={form.heroImageUrl}
                        alt="Hero"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={heroImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => heroImageInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Image
                    </button>
                    <p className="text-[10px] text-muted-foreground">
                      Recommended: 1200×800px, max 5MB
                    </p>
                    {form.heroImageUrl && !form.heroImageUrl.startsWith("/images/") && (
                      <button
                        onClick={() => setForm((prev) => ({ ...prev, heroImageUrl: "/images/DTC-BG.webp" }))}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Reset to default
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Hero URL input (for external URLs) */}
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> Image URL
                </label>
                <input
                  value={form.heroImageUrl}
                  onChange={(e) => updateField("heroImageUrl", e.target.value)}
                  placeholder="/images/hero.jpg or https://..."
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              {/* Hero Heading */}
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Heading className="h-3.5 w-3.5" /> Heading Text
                </label>
                <textarea
                  value={form.heroHeading}
                  onChange={(e) => updateField("heroHeading", e.target.value)}
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Main headline for the hero section"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  HTML entities like &amp;rsquo; will be rendered. Max ~80 characters recommended.
                </p>
              </div>

              {/* Hero Subheading */}
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Subheading / Description
                </label>
                <textarea
                  value={form.heroSubheading}
                  onChange={(e) => updateField("heroSubheading", e.target.value)}
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Subheading text below the main headline"
                />
              </div>

              {/* Preview */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-2 inline-flex rounded-full border border-border bg-card px-3 py-1 text-[10px] font-semibold text-muted-foreground">
                    Desert Technology Consultant, Namibia
                  </div>
                  <h3 className="text-lg font-semibold leading-tight text-foreground">
                    {decodeHTMLEntities(form.heroHeading)}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{form.heroSubheading}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === CONTACT TAB === */}
        {activeTab === "contact" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">Contact Details</h2>
                </div>
                <button
                  onClick={() => {
                    setShowContactForm(true);
                    setEditingContactId(null);
                    resetContactForm();
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Contact
                </button>
              </div>

              {/* Contact Details List */}
              <div className="space-y-3">
                {contactDetails.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Phone className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium text-foreground">No contact details yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add phone numbers, WhatsApp, email, or addresses to display on your storefront.
                    </p>
                  </div>
                )}

                {contactDetails.map((cd, idx) => {
                  const typeIcon = cd.type === "phone" ? Phone : cd.type === "whatsapp" ? MessageCircle : cd.type === "email" ? Mail : MapPin;
                  const Icon = typeIcon;
                  return (
                    <div
                      key={cd.id}
                      className={cn(
                        "rounded-lg border bg-card p-4 transition-all hover:shadow-sm",
                        cd.isActive ? "border-border" : "border-dashed border-border opacity-60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-foreground">{cd.label}</h3>
                              <span className="rounded-md border border-border/50 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                                {cd.type === "whatsapp" ? "WhatsApp" : cd.type}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{cd.value}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex flex-col gap-0.5 mr-1">
                            <button
                              onClick={() => moveContactDetail(cd.id, "up")}
                              disabled={isFirstContact(cd.id)}
                              className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-20 disabled:pointer-events-none"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => moveContactDetail(cd.id, "down")}
                              disabled={isLastContact(cd.id)}
                              className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-20 disabled:pointer-events-none"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            onClick={() =>
                              updateContactDetail(cd.id, { isActive: !cd.isActive })
                            }
                            className={cn(
                              "rounded-lg p-1.5 transition-colors",
                              cd.isActive ? "text-success hover:bg-success/10" : "text-muted-foreground hover:bg-muted",
                            )}
                          >
                            {cd.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => startEditContact(cd)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteContactDetail(cd.id)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add / Edit Contact Detail Form */}
              {(showContactForm || editingContactId) && (
                <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {editingContactId ? "Edit Contact Detail" : "New Contact Detail"}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Type</label>
                      <Select
                        value={contactForm.type}
                        onValueChange={(v) =>
                          setContactForm((f) => ({ ...f, type: v as ContactDetail["type"] }))
                        }
                      >
                        <SelectTrigger className="mt-1 h-10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="address">Address / Location</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Label</label>
                      <input
                        value={contactForm.label}
                        onChange={(e) => setContactForm((f) => ({ ...f, label: e.target.value }))}
                        placeholder="e.g. Main, Support, Sales, Physical"
                        className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Value</label>
                    <input
                      value={contactForm.value}
                      onChange={(e) => setContactForm((f) => ({ ...f, value: e.target.value }))}
                      placeholder={contactForm.type === "phone" ? "+264 85 277 5140" : contactForm.type === "whatsapp" ? "264852775140" : contactForm.type === "email" ? "info@example.com" : "Windhoek, Namibia"}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none"
                    />
                    {contactForm.type === "whatsapp" && (
                      <p className="mt-1 text-[10px] text-muted-foreground">Without + prefix. Used for WhatsApp links.</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddContact}
                      className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Check className="h-3 w-3" />
                      {editingContactId ? "Save Changes" : "Add Contact"}
                    </button>
                    <button
                      onClick={() => {
                        setShowContactForm(false);
                        setEditingContactId(null);
                        resetContactForm();
                      }}
                      className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === BANKING TAB === */}
        {activeTab === "banking" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">Banking Details</h2>
                </div>
                <button
                  onClick={() => {
                    setShowBankForm(true);
                    setEditingBankId(null);
                    resetBankForm();
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Bank
                </button>
              </div>

              {/* Bank Details List */}
              <div className="space-y-3">
                {bankDetails.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CreditCard className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium text-foreground">No bank details yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add your business bank accounts for customers to make payments.
                    </p>
                  </div>
                )}

                {bankDetails.map((bd, idx) => (
                  <div
                    key={bd.id}
                    className={cn(
                      "rounded-lg border bg-card p-4 transition-all hover:shadow-sm",
                      bd.isActive ? "border-border" : "border-dashed border-border opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{bd.bankName}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {bd.accountName} &middot; {bd.accountNumber}
                          </p>
                          {bd.branchCode && (
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                              Branch Code: {bd.branchCode}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col gap-0.5 mr-1">
                          <button
                            onClick={() => moveBankDetail(bd.id, "up")}
                            disabled={isFirstBank(bd.id)}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-20 disabled:pointer-events-none"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => moveBankDetail(bd.id, "down")}
                            disabled={isLastBank(bd.id)}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-20 disabled:pointer-events-none"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            updateBankDetail(bd.id, { isActive: !bd.isActive })
                          }
                          className={cn(
                            "rounded-lg p-1.5 transition-colors",
                            bd.isActive ? "text-success hover:bg-success/10" : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {bd.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => startEditBank(bd)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteBankDetail(bd.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add / Edit Bank Detail Form */}
              {(showBankForm || editingBankId) && (
                <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {editingBankId ? "Edit Bank Details" : "New Bank Account"}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Bank Name</label>
                      <input
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))}
                        placeholder="e.g. Standard Bank, FirstBank"
                        className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Account Name</label>
                      <input
                        value={bankForm.accountName}
                        onChange={(e) => setBankForm((f) => ({ ...f, accountName: e.target.value }))}
                        placeholder="e.g. Desert TECHNOLOGIES"
                        className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Account Number</label>
                      <input
                        value={bankForm.accountNumber}
                        onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value }))}
                        placeholder="e.g. 60003162833"
                        className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Branch Code</label>
                      <input
                        value={bankForm.branchCode}
                        onChange={(e) => setBankForm((f) => ({ ...f, branchCode: e.target.value }))}
                        placeholder="e.g. 082672"
                        className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddBank}
                      className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Check className="h-3 w-3" />
                      {editingBankId ? "Save Changes" : "Add Bank"}
                    </button>
                    <button
                      onClick={() => {
                        setShowBankForm(false);
                        setEditingBankId(null);
                        resetBankForm();
                      }}
                      className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === ACCOUNT TAB (Profile, Password, Sessions, Activity) === */}
        {activeTab === "account" && (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Profile</h2>
                    <p className="text-xs text-muted-foreground">Your personal account details</p>
                  </div>
                </div>
                {!isEditingProfile && !sessionLoading && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Profile
                  </button>
                )}
              </div>
              {sessionLoading ? (
                <div className="flex items-center gap-5 animate-pulse">
                  <div className="h-16 w-16 rounded-full bg-muted" />
                  <div className="space-y-3 flex-1">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-48 bg-muted rounded" />
                  </div>
                </div>
              ) : isEditingProfile ? (
                <div className="space-y-5">
                  {/* Profile Image Upload */}
                  <div className="flex items-start gap-5">
                    <div className="relative">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold overflow-hidden">
                        {profileForm.profileImage ? (
                          <img
                            src={profileForm.profileImage}
                            alt="Profile"
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <span>
                            {(profileForm.displayName || userSession?.name || "U")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        )}
                      </div>
                      {profileUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        ref={profileImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => profileImageInputRef.current?.click()}
                        disabled={profileUploading}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {profileForm.profileImage ? "Change Photo" : "Upload Photo"}
                      </button>
                      {profileForm.profileImage && (
                        <button
                          onClick={() => setProfileForm((f) => ({ ...f, profileImage: "" }))}
                          className="ml-2 text-xs text-destructive hover:text-destructive/80 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Recommended: Square image, at least 200×200px
                      </p>
                    </div>
                  </div>

                  {/* Profile Form Fields */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-foreground">Display Name</label>
                      <input
                        value={profileForm.displayName}
                        onChange={(e) => setProfileForm((f) => ({ ...f, displayName: e.target.value }))}
                        placeholder="Your display name"
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Contact Number</label>
                      <input
                        value={profileForm.contactNumber}
                        onChange={(e) => setProfileForm((f) => ({ ...f, contactNumber: e.target.value }))}
                        placeholder="Your phone number"
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Job Title</label>
                      <input
                        value={profileForm.jobTitle}
                        onChange={(e) => setProfileForm((f) => ({ ...f, jobTitle: e.target.value }))}
                        placeholder="Your job title"
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-foreground">Profile Email</label>
                      <input
                        type="email"
                        value={profileForm.profileEmail}
                        onChange={(e) => setProfileForm((f) => ({ ...f, profileEmail: e.target.value }))}
                        placeholder="Email for profile display (separate from login)"
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        This email is for display purposes only. Your login email remains unchanged for security.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingProfile(false);
                        // Reset form to current session values
                        setProfileForm({
                          displayName: userSession?.name || "",
                          contactNumber: userSession?.phone || "",
                          profileEmail: userSession?.email || "",
                          profileImage: userSession?.profileImage || "",
                          jobTitle: userSession?.jobTitle || "",
                        });
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold overflow-hidden">
                    {userSession?.profileImage ? (
                      <img
                        src={userSession.profileImage}
                        alt="Profile"
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <span>
                        {(userSession?.name || "U")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-foreground">Full Name</label>
                        <p className="mt-1 text-sm text-foreground">{userSession?.name || "—"}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground">Email</label>
                        <p className="mt-1 text-sm text-foreground">{userSession?.email || "—"}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground">Role</label>
                        <Badge variant="outline" className="mt-1 bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-1.5 py-0">
                          {userSession?.role || "—"}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground">Status</label>
                        <Badge variant="outline" className="mt-1 bg-success/10 text-success border-success/20 text-[10px] font-bold px-1.5 py-0">
                          {userSession?.status || "—"}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground">Job Title</label>
                        <p className="mt-1 text-sm text-muted-foreground">{userSession?.jobTitle || "—"}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground">Phone</label>
                        <p className="mt-1 text-sm text-muted-foreground">{userSession?.phone || "—"}</p>
                      </div>
                    </div>
                    {userSession?.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(userSession.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                    {userSession?.lastActiveAt && (
                      <p className="text-xs text-muted-foreground">
                        Last active: {new Date(userSession.lastActiveAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Password Change */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <KeyRound className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Password</h2>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordMessage && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
                    {passwordMessage}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-foreground">Current Password</label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((form) => ({ ...form, currentPassword: e.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    required
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength={10}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((form) => ({ ...form, newPassword: e.target.value }))}
                      className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength={10}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((form) => ({ ...form, confirmPassword: e.target.value }))}
                      className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Use at least 10 characters.</p>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {passwordSaving ? "Changing Password..." : "Change Password"}
                </button>
              </form>
            </div>

            {/* Active Sessions Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">Active Sessions</h2>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Current session</p>
                      <p className="text-xs text-muted-foreground">Active now</p>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Current</Badge>
                </div>
              </div>
              <button className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                <LogOut className="h-3 w-3" />
                Sign out of all devices
              </button>
            </div>

            {/* Recent Activity Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <History className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
              </div>
              <div className="space-y-3">
                {[
                  { action: "Sign in", timestamp: "Just now" },
                ].map((event, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <p className="text-sm text-foreground">{event.action}</p>
                    <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === PAYMENT METHODS TAB === */}
        {activeTab === "payment-methods" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">Payment Methods</h2>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentForm(true);
                    setEditingPaymentId(null);
                    resetPaymentForm();
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Method
                </button>
              </div>

              {/* Payment Method List */}
              <div className="space-y-3">
                {paymentMethods.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Banknote className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium text-foreground">No payment methods yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add payment methods your customers can use.
                    </p>
                  </div>
                )}

                {paymentMethods.map((pm, idx) => (
                  <div
                    key={pm.id}
                    className={cn(
                      "rounded-lg border bg-card p-4 transition-all hover:shadow-sm",
                      pm.isActive ? "border-border" : "border-dashed border-border opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                          {pm.type === "BankTransfer" ? (
                            <CreditCard className="h-5 w-5" />
                          ) : pm.type === "Cash" ? (
                            <Banknote className="h-5 w-5" />
                          ) : pm.type === "PhoneTransfer" ? (
                            <Phone className="h-5 w-5" />
                          ) : (
                            <CreditCard className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{pm.name}</h3>
                            <span className="rounded-md border border-border/50 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {pm.type === "BankTransfer" ? "Bank Transfer" : pm.type === "Cash" ? "Cash" : pm.type === "PhoneTransfer" ? "Mobile" : pm.type === "Card" ? "Card" : "Other"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{pm.details}</p>
                          {pm.instructions && (
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">{pm.instructions}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col gap-0.5 mr-1">
                          <button
                            onClick={() => movePaymentMethod(pm.id, "up")}
                            disabled={isFirstPayment(pm.id)}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-20 disabled:pointer-events-none"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => movePaymentMethod(pm.id, "down")}
                            disabled={isLastPayment(pm.id)}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-20 disabled:pointer-events-none"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            updatePaymentMethod(pm.id, { isActive: !pm.isActive })
                          }
                          className={cn(
                            "rounded-lg p-1.5 transition-colors",
                            pm.isActive ? "text-success hover:bg-success-soft" : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {pm.isActive ? <Eye className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => startEditPayment(pm)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deletePaymentMethod(pm.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add / Edit Payment Method Form */}
              {(showPaymentForm || editingPaymentId) && (
                <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {editingPaymentId ? "Edit Payment Method" : "New Payment Method"}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Name</label>
                      <input
                        value={paymentForm.name}
                        onChange={(e) => setPaymentForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Bank Transfer, Cash, E-Wallet"
                        className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Type</label>
                      <Select
                        value={paymentForm.type}
                        onValueChange={(v) =>
                          setPaymentForm((f) => ({ ...f, type: v as PaymentMethod["type"] }))
                        }
                      >
                        <SelectTrigger className="mt-1 h-10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BankTransfer">Bank Transfer</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="PhoneTransfer">Phone Transfer / Mobile Money</SelectItem>
                          <SelectItem value="Card">Card Payment</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Details</label>
                    <input
                      value={paymentForm.details}
                      onChange={(e) => setPaymentForm((f) => ({ ...f, details: e.target.value }))}
                      placeholder="e.g. Standard Bank, Cash at Store, etc."
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Instructions (optional)</label>
                    <input
                      value={paymentForm.instructions}
                      onChange={(e) => setPaymentForm((f) => ({ ...f, instructions: e.target.value }))}
                      placeholder="e.g. Use your order number as reference"
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddPayment}
                      className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Check className="h-3 w-3" />
                      {editingPaymentId ? "Save Changes" : "Add Method"}
                    </button>
                    <button
                      onClick={() => {
                        setShowPaymentForm(false);
                        setEditingPaymentId(null);
                        resetPaymentForm();
                      }}
                      className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success font-semibold">
            <Check className="h-4 w-4" />
            Settings saved!
          </span>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
