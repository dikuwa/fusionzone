"use client";

import { useState, useEffect, useRef } from "react";
import {
  Save,
  Plus,
  X,
  Check,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Upload,
  ImageIcon,
  FileText,
  Heading,
  GripVertical,
  MessageCircle,
  Phone,
  Link as LinkIcon,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { ICON_OPTIONS, getServiceIcon } from "@/lib/service-icons";
import type { ServiceRecord, SupportCard, PreOwnedTechSection, ServicesPageSettings } from "@/lib/services";
import type { StoreSettings } from "@/lib/store-settings";
import { useDashboardStore } from "@/lib/store/dashboard";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const CTA_TYPES = [
  { value: "whatsapp", label: "WhatsApp Enquiry" },
  { value: "phone", label: "Phone Call" },
  { value: "contact", label: "Contact Page" },
  { value: "custom_link", label: "Custom Link" },
  { value: "hidden", label: "Hidden" },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

interface ServiceFormData {
  title: string;
  description: string;
  icon: string;
  imageUrl: string;
  isEnabled: boolean;
  features: string[];
  primaryCtaLabel: string;
  primaryCtaType: string;
  primaryCtaDest: string;
  primaryCtaVisible: boolean;
  secondaryCtaLabel: string;
  secondaryCtaType: string;
  secondaryCtaDest: string;
  secondaryCtaVisible: boolean;
}

const emptyServiceForm: ServiceFormData = {
  title: "",
  description: "",
  icon: "Wrench",
  imageUrl: "",
  isEnabled: true,
  features: [""],
  primaryCtaLabel: "Enquire Now",
  primaryCtaType: "whatsapp",
  primaryCtaDest: "",
  primaryCtaVisible: true,
  secondaryCtaLabel: "Call Us",
  secondaryCtaType: "phone",
  secondaryCtaDest: "",
  secondaryCtaVisible: true,
};

function ServiceForm({ data, onChange, onCancel }: {
  data: ServiceFormData;
  onChange: (data: ServiceFormData) => void;
  onCancel: () => void;
}) {
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof ServiceFormData, value: any) =>
    onChange({ ...data, [field]: value });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("context", "settings");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (result.url) {
        update("imageUrl", result.url);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const addFeature = () => onChange({ ...data, features: [...data.features, ""] });
  const removeFeature = (idx: number) => {
    const features = data.features.filter((_, i) => i !== idx);
    onChange({ ...data, features: features.length === 0 ? [""] : features });
  };
  const updateFeature = (idx: number, value: string) => {
    const features = [...data.features];
    features[idx] = value;
    onChange({ ...data, features });
  };
  const moveFeature = (idx: number, direction: "up" | "down") => {
    const features = [...data.features];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= features.length) return;
    [features[idx], features[targetIdx]] = [features[targetIdx], features[idx]];
    onChange({ ...data, features });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-foreground">Service Title *</label>
          <input
            value={data.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. PC & Laptop Sales and Repairs"
            className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Icon</label>
          <Select value={data.icon} onValueChange={(v) => update("icon", v)}>
            <SelectTrigger className="mt-1 h-10">
              <SelectValue placeholder="Select icon" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {ICON_OPTIONS.map((icon) => {
                const Icon = getServiceIcon(icon);
                return (
                  <SelectItem key={icon} value={icon}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{icon}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground">Description *</label>
        <textarea
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          placeholder="Describe the service..."
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <ImageIcon className="h-3 w-3" /> Service Image
        </label>
        <div className="mt-2 flex items-start gap-4">
          <div className="relative h-24 w-36 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt="Service preview"
                className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
            {imageUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={imageUploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {data.imageUrl ? "Replace Image" : "Upload Image"}
            </button>
            {data.imageUrl && (
              <button
                onClick={() => update("imageUrl", "")}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Remove Image
              </button>
            )}
            <p className="text-[10px] text-muted-foreground">
              Recommended: 3:2 aspect ratio, max 5MB
            </p>
          </div>
        </div>
        {/* Also allow pasting external URLs */}
        <div className="mt-3">
          <label className="text-[10px] font-medium text-muted-foreground">Or paste an external URL:</label>
          <input
            value={data.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)}
            placeholder="https://..."
            className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs font-mono focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Feature List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-foreground">Feature List</label>
          <button
            onClick={addFeature}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
          >
            <Plus className="h-3 w-3" /> Add Feature
          </button>
        </div>
        <div className="space-y-2">
          {data.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveFeature(idx, "up")}
                  disabled={idx === 0}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => moveFeature(idx, "down")}
                  disabled={idx === data.features.length - 1}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>
              <input
                value={feature}
                onChange={(e) => updateFeature(idx, e.target.value)}
                placeholder="Feature description"
                className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => removeFeature(idx)}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Primary CTA */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <h4 className="text-xs font-semibold text-foreground">Primary CTA</h4>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={data.primaryCtaVisible}
              onChange={(e) => update("primaryCtaVisible", e.target.checked)}
              className="rounded border-border"
            />
            Visible
          </label>
        </div>
        {data.primaryCtaVisible && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[10px] font-medium text-foreground">Label</label>
              <input
                value={data.primaryCtaLabel}
                onChange={(e) => update("primaryCtaLabel", e.target.value)}
                placeholder="Enquire Now"
                className="mt-0.5 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-foreground">Type</label>
              <Select value={data.primaryCtaType} onValueChange={(v) => update("primaryCtaType", v)}>
                <SelectTrigger className="mt-0.5 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CTA_TYPES.filter(t => t.value !== "hidden").map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {data.primaryCtaType === "custom_link" && (
              <div>
                <label className="text-[10px] font-medium text-foreground">URL</label>
                <input
                  value={data.primaryCtaDest}
                  onChange={(e) => update("primaryCtaDest", e.target.value)}
                  placeholder="https://..."
                  className="mt-0.5 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs font-mono focus:border-primary focus:outline-none"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Secondary CTA */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <h4 className="text-xs font-semibold text-foreground">Secondary CTA</h4>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={data.secondaryCtaVisible}
              onChange={(e) => update("secondaryCtaVisible", e.target.checked)}
              className="rounded border-border"
            />
            Visible
          </label>
        </div>
        {data.secondaryCtaVisible && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[10px] font-medium text-foreground">Label</label>
              <input
                value={data.secondaryCtaLabel}
                onChange={(e) => update("secondaryCtaLabel", e.target.value)}
                placeholder="Call Us"
                className="mt-0.5 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-foreground">Type</label>
              <Select value={data.secondaryCtaType} onValueChange={(v) => update("secondaryCtaType", v)}>
                <SelectTrigger className="mt-0.5 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CTA_TYPES.filter(t => t.value !== "hidden").map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {data.secondaryCtaType === "custom_link" && (
              <div>
                <label className="text-[10px] font-medium text-foreground">URL</label>
                <input
                  value={data.secondaryCtaDest}
                  onChange={(e) => update("secondaryCtaDest", e.target.value)}
                  placeholder="https://..."
                  className="mt-0.5 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs font-mono focus:border-primary focus:outline-none"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
        >
          <X className="h-3 w-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

export function ServicesPageSettings() {
  const settings = useDashboardStore((s) => s.settings) as unknown as StoreSettings;
  const updateSettings = useDashboardStore((s) => s.updateSettings);

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageSettings, setPageSettings] = useState<ServicesPageSettings>(settings.servicesPage);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceForm, setEditingServiceForm] = useState<ServiceFormData>(emptyServiceForm);
  const [isAddingService, setIsAddingService] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch services on mount
  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setServices(data.services);
      })
      .catch(() => toast.error("Failed to load services"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPageSettings(settings.servicesPage);
  }, [settings.servicesPage]);

  const handleSavePageSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicesPage: pageSettings }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save");
      updateSettings(data.settings);
      toast.success("Services page settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = async () => {
    if (!editingServiceForm.title.trim()) {
      toast.error("Service title is required");
      return;
    }
    if (!editingServiceForm.description.trim()) {
      toast.error("Service description is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          data: {
            ...editingServiceForm,
            sortOrder: services.length,
            features: editingServiceForm.features.filter((f) => f.trim()),
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create service");
      setServices([...services, data.service]);
      setIsAddingService(false);
      setEditingServiceForm(emptyServiceForm);
      toast.success("Service created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateService = async () => {
    if (!editingServiceId) return;
    if (!editingServiceForm.title.trim()) {
      toast.error("Service title is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: editingServiceId,
          data: {
            ...editingServiceForm,
            features: editingServiceForm.features.filter((f) => f.trim()),
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update service");
      setServices(services.map((s) => (s.id === editingServiceId ? data.service : s)));
      setEditingServiceId(null);
      setEditingServiceForm(emptyServiceForm);
      toast.success("Service updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update service");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete");
      setServices(services.filter((s) => s.id !== id));
      toast.success("Service deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete service");
    } finally {
      setSaving(false);
      setDeleteConfirmId(null);
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = services.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= services.length) return;

    const newServices = [...services];
    [newServices[idx], newServices[targetIdx]] = [newServices[targetIdx], newServices[idx]];
    const reordered = newServices.map((s, i) => ({ ...s, sortOrder: i }));
    setServices(reordered);

    try {
      await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          orderedIds: reordered.map((s) => s.id),
        }),
      });
    } catch {
      toast.error("Failed to save order");
    }
  };

  const startEdit = (service: ServiceRecord) => {
    setEditingServiceId(service.id);
    setEditingServiceForm({
      title: service.title,
      description: service.description,
      icon: service.icon,
      imageUrl: service.imageUrl || "",
      isEnabled: service.isEnabled,
      features: service.features.length > 0 ? service.features : [""],
      primaryCtaLabel: service.primaryCtaLabel,
      primaryCtaType: service.primaryCtaType,
      primaryCtaDest: service.primaryCtaDest || "",
      primaryCtaVisible: service.primaryCtaVisible,
      secondaryCtaLabel: service.secondaryCtaLabel,
      secondaryCtaType: service.secondaryCtaType,
      secondaryCtaDest: service.secondaryCtaDest || "",
      secondaryCtaVisible: service.secondaryCtaVisible,
    });
    setIsAddingService(false);
  };

  const startAdd = () => {
    setIsAddingService(true);
    setEditingServiceId(null);
    setEditingServiceForm(emptyServiceForm);
  };

  const updatePageField = (section: string, field: string, value: any) => {
    setPageSettings((prev) => {
      const updated = { ...prev };
      if (section === "header") {
        updated.header = { ...updated.header, [field]: value };
      } else if (section === "preOwnedTech") {
        updated.preOwnedTech = { ...updated.preOwnedTech, [field]: value };
      } else if (section === "bottomCta") {
        updated.bottomCta = { ...updated.bottomCta, [field]: value };
      }
      return updated;
    });
  };

  const updateSupportCard = (id: string, data: Partial<SupportCard>) => {
    setPageSettings((prev) => ({
      ...prev,
      supportCards: prev.supportCards.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    }));
  };

  const addSupportCard = () => {
    const id = generateId();
    setPageSettings((prev) => ({
      ...prev,
      supportCards: [
        ...prev.supportCards,
        { id, title: "", description: "", icon: "Wrench", isEnabled: true, sortOrder: prev.supportCards.length },
      ],
    }));
  };

  const deleteSupportCard = (id: string) => {
    setPageSettings((prev) => ({
      ...prev,
      supportCards: prev.supportCards.filter((c) => c.id !== id),
    }));
  };

  const moveSupportCard = (id: string, direction: "up" | "down") => {
    setPageSettings((prev) => {
      const cards = [...prev.supportCards];
      const idx = cards.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= cards.length) return prev;
      [cards[idx], cards[targetIdx]] = [cards[targetIdx], cards[idx]];
      return { ...prev, supportCards: cards.map((c, i) => ({ ...c, sortOrder: i })) };
    });
  };

  const addPreOwnedFeature = () => {
    setPageSettings((prev) => ({
      ...prev,
      preOwnedTech: { ...prev.preOwnedTech, features: [...prev.preOwnedTech.features, ""] },
    }));
  };

  const updatePreOwnedFeature = (idx: number, value: string) => {
    setPageSettings((prev) => {
      const features = [...prev.preOwnedTech.features];
      features[idx] = value;
      return { ...prev, preOwnedTech: { ...prev.preOwnedTech, features } };
    });
  };

  const removePreOwnedFeature = (idx: number) => {
    setPageSettings((prev) => ({
      ...prev,
      preOwnedTech: {
        ...prev.preOwnedTech,
        features: prev.preOwnedTech.features.filter((_, i) => i !== idx),
      },
    }));
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-4 w-72 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Heading className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Page Header</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-foreground">Eyebrow / Small Label (optional)</label>
            <input
              value={pageSettings.header.eyebrow}
              onChange={(e) => updatePageField("header", "eyebrow", e.target.value)}
              placeholder="e.g. Also available"
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Heading *</label>
            <input
              value={pageSettings.header.heading}
              onChange={(e) => updatePageField("header", "heading", e.target.value)}
              placeholder="Our Services"
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Description *</label>
          <textarea
            value={pageSettings.header.description}
            onChange={(e) => updatePageField("header", "description", e.target.value)}
            rows={2}
            placeholder="Page description..."
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Main Services */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Main Services</h2>
          </div>
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Service
          </button>
        </div>

        {services.length === 0 && !isAddingService && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-foreground">No services yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first service to display on the Services page.</p>
          </div>
        )}

        {/* Add Service Form */}
        {isAddingService && (
          <div className="rounded-lg border border-primary/30 bg-muted/30 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">New Service</h3>
            <ServiceForm
              data={editingServiceForm}
              onChange={setEditingServiceForm}
              onCancel={() => { setIsAddingService(false); setEditingServiceForm(emptyServiceForm); }}
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddService}
                disabled={saving}
                className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Creating..." : <><Check className="h-3 w-3" /> Create Service</>}
              </button>
            </div>
          </div>
        )}

        {/* Edit Service Form */}
        {editingServiceId && (
          <div className="rounded-lg border border-primary/30 bg-muted/30 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Edit Service</h3>
            <ServiceForm
              data={editingServiceForm}
              onChange={setEditingServiceForm}
              onCancel={() => { setEditingServiceId(null); setEditingServiceForm(emptyServiceForm); }}
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleUpdateService}
                disabled={saving}
                className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Saving..." : <><Check className="h-3 w-3" /> Save Changes</>}
              </button>
            </div>
          </div>
        )}

        {/* Service List */}
        <div className="space-y-3">
          {services.map((service, idx) => {
            const Icon = getServiceIcon(service.icon);
            return (
              <div
                key={service.id}
                className={cn(
                  "rounded-lg border bg-card p-4 transition-all",
                  service.isEnabled ? "border-border" : "border-dashed border-border opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground truncate">{service.title}</h3>
                        <span className="text-[10px] text-muted-foreground">#{service.sortOrder + 1}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{service.description}</p>
                      {service.features.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1">{service.features.length} features</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex flex-col gap-0.5 mr-1">
                      <button
                        onClick={() => handleReorder(service.id, "up")}
                        disabled={idx === 0}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleReorder(service.id, "down")}
                        disabled={idx === services.length - 1}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={async () => {
                        const updated = { ...service, isEnabled: !service.isEnabled };
                        try {
                          await fetch("/api/services", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "update",
                              id: service.id,
                              data: { isEnabled: !service.isEnabled },
                            }),
                          });
                          setServices(services.map((s) => s.id === service.id ? { ...s, isEnabled: !s.isEnabled } : s));
                        } catch { toast.error("Failed to update"); }
                      }}
                      className={cn(
                        "rounded-lg p-1.5 transition-colors",
                        service.isEnabled ? "text-success hover:bg-success/10" : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {service.isEnabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => startEdit(service)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(service.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this service?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The service will be permanently removed from your Services page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={saving}
                onClick={(e) => {
                  e.preventDefault();
                  if (deleteConfirmId) handleDeleteService(deleteConfirmId);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {saving ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Additional Support Section */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Additional Support Section</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-foreground">Section Heading</label>
            <input
              value={pageSettings.supportSectionHeading}
              onChange={(e) => setPageSettings((prev) => ({ ...prev, supportSectionHeading: e.target.value }))}
              placeholder="Support beyond the main service"
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Section Description (optional)</label>
            <input
              value={pageSettings.supportSectionDescription}
              onChange={(e) => setPageSettings((prev) => ({ ...prev, supportSectionDescription: e.target.value }))}
              placeholder="Brief description for this section"
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <h3 className="text-xs font-semibold text-foreground">Support Cards</h3>
          <button
            onClick={addSupportCard}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Card
          </button>
        </div>

        {/* Support Cards Editor */}
        <div className="space-y-3">
          {pageSettings.supportCards.map((card, idx) => (
            <div key={card.id} className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Card {idx + 1}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveSupportCard(card.id, "up")} disabled={idx === 0} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"><ArrowUp className="h-3 w-3" /></button>
                  <button onClick={() => moveSupportCard(card.id, "down")} disabled={idx === pageSettings.supportCards.length - 1} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"><ArrowDown className="h-3 w-3" /></button>
                  <button onClick={() => updateSupportCard(card.id, { isEnabled: !card.isEnabled })} className={cn("rounded p-1", card.isEnabled ? "text-success" : "text-muted-foreground")}>
                    {card.isEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                  <button onClick={() => deleteSupportCard(card.id)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[10px] font-medium text-foreground">Title</label>
                  <input
                    value={card.title}
                    onChange={(e) => updateSupportCard(card.id, { title: e.target.value })}
                    placeholder="Card title"
                    className="mt-0.5 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-foreground">Icon</label>
                  <Select value={card.icon} onValueChange={(v) => updateSupportCard(card.id, { icon: v })}>
                    <SelectTrigger className="mt-0.5 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-foreground">Description</label>
                <textarea
                  value={card.description}
                  onChange={(e) => updateSupportCard(card.id, { description: e.target.value })}
                  rows={2}
                  placeholder="Card description..."
                  className="mt-0.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pre-Owned Technology Section */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Pre-Owned Technology Section</h2>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={pageSettings.preOwnedTech.isEnabled}
              onChange={(e) => updatePageField("preOwnedTech", "isEnabled", e.target.checked)}
              className="rounded border-border"
            />
            Show this section on Services page
          </label>
        </div>
        {pageSettings.preOwnedTech.isEnabled && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-foreground">Title</label>
                <input
                  value={pageSettings.preOwnedTech.title}
                  onChange={(e) => updatePageField("preOwnedTech", "title", e.target.value)}
                  placeholder="Section title"
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Icon</label>
                <Select
                  value={pageSettings.preOwnedTech.icon}
                  onValueChange={(v) => updatePageField("preOwnedTech", "icon", v)}
                >
                  <SelectTrigger className="mt-1 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {ICON_OPTIONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Description</label>
              <textarea
                value={pageSettings.preOwnedTech.description}
                onChange={(e) => updatePageField("preOwnedTech", "description", e.target.value)}
                rows={2}
                placeholder="Section description..."
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-foreground">Feature Items</label>
                <button onClick={addPreOwnedFeature} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80">
                  <Plus className="h-3 w-3" /> Add Feature
                </button>
              </div>
              <div className="space-y-2">
                {pageSettings.preOwnedTech.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={feature}
                      onChange={(e) => updatePreOwnedFeature(idx, e.target.value)}
                      placeholder="Feature description"
                      className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                    />
                    <button onClick={() => removePreOwnedFeature(idx)} className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA Section */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Bottom CTA Section</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-foreground">Heading</label>
            <input
              value={pageSettings.bottomCta.heading}
              onChange={(e) => updatePageField("bottomCta", "heading", e.target.value)}
              placeholder="Need a custom solution?"
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Description</label>
          <textarea
            value={pageSettings.bottomCta.description}
            onChange={(e) => updatePageField("bottomCta", "description", e.target.value)}
            rows={2}
            placeholder="CTA description..."
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground">Primary CTA</h4>
            <div>
              <label className="text-[10px] font-medium text-foreground">Label</label>
              <input
                value={pageSettings.bottomCta.primaryCtaLabel}
                onChange={(e) => updatePageField("bottomCta", "primaryCtaLabel", e.target.value)}
                placeholder="Chat on WhatsApp"
                className="mt-0.5 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-foreground">Type</label>
              <Select
                value={pageSettings.bottomCta.primaryCtaType}
                onValueChange={(v) => updatePageField("bottomCta", "primaryCtaType", v)}
              >
                <SelectTrigger className="mt-0.5 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CTA_TYPES.filter(t => t.value !== "hidden").map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {pageSettings.bottomCta.primaryCtaType === "custom_link" && (
              <div>
                <label className="text-[10px] font-medium text-foreground">URL</label>
                <input
                  value={pageSettings.bottomCta.primaryCtaDest || ""}
                  onChange={(e) => updatePageField("bottomCta", "primaryCtaDest", e.target.value)}
                  placeholder="https://..."
                  className="mt-0.5 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs font-mono focus:border-primary focus:outline-none"
                />
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground">Secondary CTA</h4>
            <div>
              <label className="text-[10px] font-medium text-foreground">Label</label>
              <input
                value={pageSettings.bottomCta.secondaryCtaLabel}
                onChange={(e) => updatePageField("bottomCta", "secondaryCtaLabel", e.target.value)}
                placeholder="Send Enquiry"
                className="mt-0.5 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-foreground">Type</label>
              <Select
                value={pageSettings.bottomCta.secondaryCtaType}
                onValueChange={(v) => updatePageField("bottomCta", "secondaryCtaType", v)}
              >
                <SelectTrigger className="mt-0.5 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CTA_TYPES.filter(t => t.value !== "hidden").map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {pageSettings.bottomCta.secondaryCtaType === "custom_link" && (
              <div>
                <label className="text-[10px] font-medium text-foreground">URL</label>
                <input
                  value={pageSettings.bottomCta.secondaryCtaDest || ""}
                  onChange={(e) => updatePageField("bottomCta", "secondaryCtaDest", e.target.value)}
                  placeholder="https://..."
                  className="mt-0.5 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs font-mono focus:border-primary focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <button
          onClick={handleSavePageSettings}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Page Settings"}
        </button>
      </div>
    </div>
  );
}
