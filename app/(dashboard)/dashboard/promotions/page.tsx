"use client";

import { useState, useRef } from "react";
import {
  Megaphone,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  X,
  Check,
  Trash2,
  GripVertical,
  ImagePlus,
  Loader2,
  Star,
  MapPin,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FadeIn } from "@/components/ui/fade-in";
import { useDashboardStore } from "@/lib/store/dashboard";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DesertCheckbox } from "@/components/ui/desert-checkbox";
import { toast } from "sonner";
import type { DashboardPromotion } from "@/lib/dashboard-data";
import { SortableImageGallery } from "@/components/ui/sortable-image-gallery";
import { ProductImage } from "@/components/ui/product-image";

const inputClass = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors";
const textareaClass = "w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors";

function LabeledField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

function PlacementSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-full rounded-lg border-border bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20">
        <SelectValue placeholder="Placement" />
      </SelectTrigger>
      <SelectContent className="z-[80] border-border bg-card shadow-lg">
        <SelectItem value="HomeHero">Home Hero</SelectItem>
        <SelectItem value="FeaturedSection">Featured Section</SelectItem>
        <SelectItem value="ProductBadge">Product Badge</SelectItem>
      </SelectContent>
    </Select>
  );
}

function TypeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-full rounded-lg border-border bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20">
        <SelectValue placeholder="Type" />
      </SelectTrigger>
      <SelectContent className="z-[80] border-border bg-card shadow-lg">
        <SelectItem value="general">General Offer</SelectItem>
        <SelectItem value="product">Product Offer</SelectItem>
        <SelectItem value="bundle">Bundle Deal</SelectItem>
        <SelectItem value="service">Service Offer</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ============== Sortable Promotion Card ==============
function SortablePromotionCard({
  promo,
  isEditing,
  position,
  onEdit,
  onDelete,
  onToggle,
  onStartEdit,
  children,
}: {
  promo: DashboardPromotion;
  isEditing: boolean;
  position: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onStartEdit: () => void;
  children?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: promo.id,
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border border-border bg-card transition-all",
        !promo.isActive && "opacity-50",
        isDragging && "shadow-lg border-primary/50 z-50",
        isEditing && "md:col-span-2 xl:col-span-3",
        !isEditing && "hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      {isEditing ? (
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Editing promotion</p>
              <h3 className="mt-0.5 text-base font-semibold text-foreground">{promo.title}</h3>
            </div>
            <button onClick={onDelete} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {children}
        </div>
      ) : (
        <>
          <div className="relative flex aspect-[16/8] items-center justify-center overflow-hidden rounded-t-xl bg-muted/25 p-3">
            <ProductImage src={promo.imageUrl} alt={promo.title} className="object-contain" />
            <button
              {...attributes}
              {...listeners}
              className="absolute left-3 top-3 flex h-8 touch-none cursor-grab items-center gap-1 rounded-md border border-border bg-card/95 px-2 text-[10px] font-bold text-foreground shadow-sm transition-colors hover:bg-card active:cursor-grabbing"
              title="Drag to reorder"
              aria-label={`Drag ${promo.title} to reorder`}
            >
              <GripVertical className="h-3.5 w-3.5 text-primary" />
              {position}
            </button>
            <div className="absolute right-3 top-3 flex items-center gap-1">
              {promo.isFeatured && (
                <span className="flex items-center gap-1 rounded-md border border-primary/20 bg-card/95 px-2 py-1 text-[10px] font-semibold text-primary shadow-sm">
                  <Star className="h-3 w-3 fill-current" /> Featured
                </span>
              )}
              <span className={cn(
                "rounded-md border px-2 py-1 text-[10px] font-semibold shadow-sm",
                promo.isActive
                  ? "border-success/20 bg-card/95 text-success"
                  : "border-border bg-card/95 text-muted-foreground",
              )}>
                {promo.isActive ? "Live" : "Hidden"}
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground">{promo.title}</h3>
                <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-muted-foreground">{promo.description || "No description added."}</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button onClick={onToggle} title={promo.isActive ? "Hide from storefront" : "Show on storefront"}
                  className={cn("rounded-md p-1.5 transition-colors", promo.isActive ? "text-success hover:bg-success-soft" : "text-muted-foreground hover:bg-muted")}>
                  {promo.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button onClick={onStartEdit} title="Edit promotion" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={onDelete} title="Delete promotion" className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
              {promo.discountLabel && <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{promo.discountLabel}</span>}
              <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                <MapPin className="h-3 w-3" /> {promo.placement}
              </span>
              {promo.type && <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium capitalize text-muted-foreground">{promo.type}</span>}
              <span className="ml-auto text-[10px] text-muted-foreground">{promo.productCount} products</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============== Main Page Component ==============
export default function DashboardPromotionsPage() {
  const promotions = useDashboardStore((s) => s.promotions);
  const syncPromotions = useDashboardStore((s) => s.syncPromotions);

  const refreshPromotions = async () => {
    const response = await fetch("/api/promotions", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load promotions.");
    syncPromotions(data.promotions ?? []);
  };

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "", images: [] as string[], discountLabel: "", placement: "FeaturedSection", type: "general" as string, isFeatured: true });
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const addImageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const resetForm = () => { setForm({ title: "", description: "", imageUrl: "", images: [], discountLabel: "", placement: "FeaturedSection", type: "general", isFeatured: true }); setSelectedImage(0); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMultiple = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("context", "promotion");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) uploadedUrls.push(data.url);
      }
      if (uploadedUrls.length > 0) {
        setForm((f) => {
          const currentImages = f.images || [];
          const newImages = isMultiple ? [...currentImages, ...uploadedUrls] : uploadedUrls;
          return { ...f, images: newImages, imageUrl: newImages[0] || "" };
        });
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  /** Delete an image from storage (R2) when removed. */
  const deleteImageFromStorage = async (url: string) => {
    // Only attempt deletion for remote URLs (not data: or /images/ paths)
    if (!url || url.startsWith("data:") || url.startsWith("/images/")) return;
    try {
      // Derive the key from the URL by extracting the filename portion
      const urlParts = url.split("/");
      const filename = urlParts[urlParts.length - 1];
      const key = `images/${filename}`;
      await fetch("/api/upload/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
    } catch (err) {
      console.error("Failed to delete image from storage:", err);
    }
  };

  const handleRemoveImage = (idx: number) => {
    const removedUrl = form.images[idx];
    const newImages = form.images.filter((_, i) => i !== idx);
    setForm(f => ({ ...f, images: newImages, imageUrl: newImages[0] || "" }));
    if (selectedImage >= newImages.length) setSelectedImage(Math.max(0, newImages.length - 1));
    // Delete from storage
    if (removedUrl) deleteImageFromStorage(removedUrl);
  };

  const handleImageReorder = (oldIdx: number, newIdx: number) => {
    const newImages = [...form.images];
    const [moved] = newImages.splice(oldIdx, 1);
    newImages.splice(newIdx, 0, moved);
    setForm(f => ({ ...f, images: newImages, imageUrl: newImages[0] || "" }));
    setSelectedImage(newIdx);
  };

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    try {
      const response = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, title: form.title.trim(), description: form.description.trim(), isActive: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create promotion.");
      await refreshPromotions();
      resetForm();
      setShowAdd(false);
      toast.success("Promotion created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create promotion.");
    }
  };

  const handleEdit = async (id: string) => {
    if (!form.title.trim()) return;
    try {
      const response = await fetch(`/api/promotions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, title: form.title.trim(), description: form.description.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update promotion.");
      await refreshPromotions();
      resetForm();
      setEditId(null);
      toast.success("Promotion updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update promotion.");
    }
  };

  /** Reorder promotions via drag-and-drop — reassigns sortOrders on the server. */
  const handlePromotionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sorted = getSortedPromotions();
    const oldIdx = sorted.findIndex((p) => p.id === active.id);
    const newIdx = sorted.findIndex((p) => p.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    // Reorder the array
    const reordered = [...sorted];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);

    // Assign new sortOrders based on position
    try {
      await Promise.all(
        reordered.map((promo, idx) =>
          fetch(`/api/promotions/${promo.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: idx }),
          })
        )
      );
      await refreshPromotions();
      toast.success("Promotions reordered");
    } catch (error) {
      toast.error("Could not reorder promotions.");
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const response = await fetch(`/api/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (!response.ok) return toast.error("Could not update promotion.");
    await refreshPromotions();
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/promotions/${id}`, { method: "DELETE" });
    if (!response.ok) return toast.error("Could not delete promotion.");
    await refreshPromotions();
  };

  const startEdit = (promo: typeof promotions[0]) => {
    setEditId(promo.id);
    const promoImages = promo.images || (promo.imageUrl ? [promo.imageUrl] : []);
    setForm({
      title: promo.title,
      description: promo.description,
      imageUrl: promo.imageUrl || "",
      images: promoImages,
      discountLabel: promo.discountLabel || "",
      placement: promo.placement,
      type: promo.type || "general",
      isFeatured: promo.isFeatured !== false,
    });
    setSelectedImage(0);
  };

  // sortOrder is the single source of truth across admin and storefront.
  const getSortedPromotions = () =>
    [...promotions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const sortedPromotions = getSortedPromotions();

  // Promotion DnD context - only enable when not editing
  const promotionIds = sortedPromotions.map((p) => p.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Promotions</h1>
          <p className="text-sm text-muted-foreground mt-1">{promotions.filter(p => p.isActive).length} active promotions — use the numbered drag handles to set storefront order</p>
        </div>
        <button onClick={() => { setShowAdd(true); resetForm(); }} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Promotion
        </button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
              <Megaphone className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">New Promotion</h3>
              <p className="text-xs text-muted-foreground">Build the storefront message and arrange its media.</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <LabeledField label="Promotion title" required>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Promotion title"
                  className={inputClass} />
              </LabeledField>
              <LabeledField label="Description">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={5} placeholder="Describe the offer and why customers should care"
                  className={textareaClass} />
              </LabeledField>
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledField label="Discount label">
                  <input value={form.discountLabel} onChange={e => setForm(f => ({ ...f, discountLabel: e.target.value }))} placeholder="e.g. Save 20%"
                    className={inputClass} />
                </LabeledField>
                <LabeledField label="Storefront placement">
                  <PlacementSelect value={form.placement} onChange={v => setForm(f => ({ ...f, placement: v }))} />
                </LabeledField>
                <LabeledField label="Promotion type">
                  <TypeSelect value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} />
                </LabeledField>
                <div className="flex items-end pb-2">
                  <DesertCheckbox
                    checked={form.isFeatured}
                    onChange={(e) => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                    label={<div><span className="text-sm font-medium text-foreground">Featured promotion</span><p className="mt-0.5 text-xs text-muted-foreground">Prioritize this offer on the storefront.</p></div>}
                    wrapperClassName="items-start"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <ImageDnDZone
                images={form.images}
                selectedImage={selectedImage}
                onSelectImage={setSelectedImage}
                onRemoveImage={handleRemoveImage}
                onReorder={handleImageReorder}
                onUploadClick={() => addImageInputRef.current?.click()}
                uploading={uploading}
              />
              <input ref={addImageInputRef} type="file" accept="image/*" multiple onChange={e => handleImageUpload(e, true)} className="hidden" />
            </div>
          </div>

          <div className="mt-5 flex gap-2 border-t border-border pt-4">
            <button onClick={handleAdd} className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"><Check className="h-3 w-3" /> Create</button>
            <button onClick={() => { setShowAdd(false); resetForm(); }} className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"><X className="h-3 w-3" /> Cancel</button>
          </div>
        </div>
      )}

      {/* Promotion List with DnD */}
      <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handlePromotionDragEnd}>
        <SortableContext items={promotionIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedPromotions.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-foreground">No promotions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create your first promotion to display on the storefront.</p>
              </div>
            )}
            {sortedPromotions.map((promo, i) => (
              <FadeIn key={promo.id} delay={i * 0.03}>
                <SortablePromotionCard
                  promo={promo}
                  isEditing={editId === promo.id}
                  position={i + 1}
                  onEdit={() => handleEdit(promo.id)}
                  onDelete={() => setDeleteConfirm(promo.id)}
                  onToggle={() => handleToggle(promo.id, promo.isActive)}
                  onStartEdit={() => startEdit(promo)}
                >
                  {/* Inline edit form */}
                  <div className="space-y-3 mt-4 pt-4 border-t border-border">
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                      className="h-auto w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />

                    {/* Images in edit */}
                    <ImageDnDZone
                      images={form.images}
                      selectedImage={selectedImage}
                      onSelectImage={setSelectedImage}
                      onRemoveImage={handleRemoveImage}
                      onReorder={handleImageReorder}
                      onUploadClick={() => editImageInputRef.current?.click()}
                      uploading={uploading}
                    />
                    <input ref={editImageInputRef} type="file" accept="image/*" multiple onChange={e => handleImageUpload(e, true)} className="hidden" />

                    <div className="grid grid-cols-2 gap-2">
                      <input value={form.discountLabel} onChange={e => setForm(f => ({ ...f, discountLabel: e.target.value }))} placeholder="Discount label"
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none" />
                      <Select value={form.placement} onValueChange={v => setForm(f => ({ ...f, placement: v }))}>
                        <SelectTrigger className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/30">
                          <SelectValue placeholder="Placement" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border shadow-lg z-[80]">
                          <SelectItem value="HomeHero" className="text-sm cursor-pointer focus:bg-accent">Home Hero</SelectItem>
                          <SelectItem value="FeaturedSection" className="text-sm cursor-pointer focus:bg-accent">Featured Section</SelectItem>
                          <SelectItem value="ProductBadge" className="text-sm cursor-pointer focus:bg-accent">Product Badge</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                        <SelectTrigger className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/30">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border shadow-lg z-[80]">
                          <SelectItem value="general" className="text-sm cursor-pointer focus:bg-accent">General Offer</SelectItem>
                          <SelectItem value="product" className="text-sm cursor-pointer focus:bg-accent">Product Offer</SelectItem>
                          <SelectItem value="bundle" className="text-sm cursor-pointer focus:bg-accent">Bundle Deal</SelectItem>
                          <SelectItem value="service" className="text-sm cursor-pointer focus:bg-accent">Service Offer</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center h-10">
                        <DesertCheckbox
                          checked={form.isFeatured}
                          onChange={(e) => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                          label="Featured"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleEdit(promo.id)} className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"><Check className="h-3 w-3" /> Save</button>
                      <button onClick={() => { setEditId(null); resetForm(); }} className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"><X className="h-3 w-3" /> Cancel</button>
                    </div>
                  </div>
                </SortablePromotionCard>
              </FadeIn>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ConfirmDialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
        title="Delete promotion?"
        description="This promotion will be permanently removed from the store. This action cannot be undone."
        confirm={{
          label: "Delete Promotion",
          onClick: () => {
            if (deleteConfirm) void handleDelete(deleteConfirm);
            setDeleteConfirm(null);
          },
          variant: "danger",
        }}
      />
    </div>
  );
}

// ============== Shared Image DnD Zone ==============
function ImageDnDZone({
  images,
  selectedImage,
  onSelectImage,
  onRemoveImage,
  onReorder,
  onUploadClick,
  uploading,
}: {
  images: string[];
  selectedImage: number;
  onSelectImage: (idx: number) => void;
  onRemoveImage: (idx: number) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  onUploadClick: () => void;
  uploading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Promotion images</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">The first image is used as the storefront cover.</p>
        </div>
        <span className="shrink-0 rounded-md bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">{images.length} image{images.length !== 1 ? "s" : ""}</span>
      </div>

      <button
        type="button"
        onClick={onUploadClick}
        disabled={uploading}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-all",
          uploading ? "border-primary/40 bg-accent/30" : "border-border bg-background hover:border-primary/40 hover:bg-accent/20",
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="mb-2 h-7 w-7 animate-spin text-primary" />
            <span className="text-xs font-medium text-primary">Uploading images...</span>
          </>
        ) : (
          <>
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary">
              <ImagePlus className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium text-foreground">{images.length > 0 ? "Add more images" : "Upload promotion images"}</span>
            <span className="mt-1 text-[11px] text-muted-foreground">Select multiple JPG, PNG, or WebP files</span>
          </>
        )}
      </button>

      {images.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border border-border bg-muted">
            <ProductImage
              src={images[selectedImage]}
              alt={`Promotion image ${selectedImage + 1}`}
            />
          </div>
          <SortableImageGallery
            images={images}
            selectedImage={selectedImage}
            onSelectImage={onSelectImage}
            onRemoveImage={onRemoveImage}
            onReorder={onReorder}
          />
        </div>
      )}
    </div>
  );
}
