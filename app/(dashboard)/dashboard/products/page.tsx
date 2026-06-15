"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Plus, Download, ChevronLeft, ChevronRight, Package, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useDashboardStore } from "@/lib/store/dashboard";
import { formatCents, getStatusBadgeClass, getStatusLabel } from "@/lib/dashboard-data";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/ui/product-image";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("sku") || "");
  const [availFilter, setAvailFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteDialogName, setDeleteDialogName] = useState("");

  const products = useDashboardStore((s) => s.products);
  const deleteProduct = useDashboardStore((s) => s.deleteProduct);
  const updateProduct = useDashboardStore((s) => s.updateProduct);

  const filtered = useMemo(() => {
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }
    if (availFilter !== "All") result = result.filter(p => p.availability === availFilter);
    return result;
  }, [search, availFilter, products]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const lowStockCount = products.filter(p => p.availability === "LowStock" || p.stockQuantity <= p.lowStockThreshold).length;

  const handleExport = () => {
    const headers = ["Name", "Brand", "Category", "Price", "Stock", "Status", "Condition", "SKU"];
    const rows = filtered.map(p => [
      p.name,
      p.brand,
      p.category,
      formatCents(p.priceCents),
      p.stockQuantity.toString(),
      getStatusLabel(p.availability),
      p.condition,
      p.sku || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete product.");
      deleteProduct(id);
      toast.success("Product deleted");
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete product.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} products · {lowStockCount} low stock</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/products/new" className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Product
          </Link>
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search products..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
        <Select value={availFilter} onValueChange={v => { setAvailFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="h-10 w-[160px] rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/30">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border shadow-lg z-[80]">
            <SelectItem value="All" className="text-sm cursor-pointer focus:bg-accent">All Availability</SelectItem>
            <SelectItem value="InStock" className="text-sm cursor-pointer focus:bg-accent">In Stock</SelectItem>
            <SelectItem value="LowStock" className="text-sm cursor-pointer focus:bg-accent">Low Stock</SelectItem>
            <SelectItem value="OutOfStock" className="text-sm cursor-pointer focus:bg-accent">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FadeIn delay={0.1}>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map(product => (
              <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-border overflow-hidden flex-shrink-0">
                      <ProductImage src={product.imageUrl} alt={product.name} showFallbackText={false} />
                    </div>
                    <div>
                      <Link href={`/dashboard/products/${product.id}/edit`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">{product.name}</Link>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                    </div>                    </div>
                  </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-muted-foreground">{product.sku || "—"}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{product.category}</td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground">{formatCents(product.priceCents)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{product.stockQuantity}</span>
                    {(product.availability === "LowStock" || product.stockQuantity <= product.lowStockThreshold) && product.stockQuantity > 0 && (
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold", getStatusBadgeClass(product.availability))}>
                    {getStatusLabel(product.availability)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{product.condition}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/products/${product.id}/edit`} className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
                      <Pencil className="h-3 w-3" /> Edit
                    </Link>
                    <button
                      onClick={() => { setDeleteConfirm(product.id); setDeleteDialogName(product.name); }}
                      className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors" title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginated.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">No products found</p>
          </div>
        )}
      </div>
      </FadeIn>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40 transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40 transition-colors">
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
        title="Delete product?"
        description={`${deleteDialogName} will be permanently removed from the store. This action cannot be undone.`}
        confirm={{ label: "Delete Product", onClick: () => deleteConfirm && handleDelete(deleteConfirm), variant: "danger" }}
      />
    </div>
  );
}
