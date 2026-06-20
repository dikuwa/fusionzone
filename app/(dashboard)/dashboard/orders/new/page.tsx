"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  User,
  ShoppingBag,
  CreditCard,
  Search,
  Check,
  Save,
} from "lucide-react";
import { useDashboardStore } from "@/lib/store/dashboard";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/dashboard-data";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DesertCheckbox } from "@/components/ui/desert-checkbox";
import { toast } from "sonner";

interface LineItem {
  name: string;
  quantity: number;
  unitPriceCents: number;
  sku?: string;
}

const PAYMENT_METHODS = ["BankTransfer", "Cash", "PhoneTransfer", "Card", "Other"] as const;
const CONTACT_METHODS = ["WhatsApp", "Phone", "Email"] as const;

// Section card component
function SectionCard({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {children}
    </div>
  );
}

// Section header with icon using the primary accent
function SectionHeader({ 
  icon: Icon, 
  title,
  action
}: { 
  icon: React.ElementType; 
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
      <div className="flex items-center gap-2.5">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// Form field label
function FieldLabel({ 
  children, 
  required,
  hint
}: { 
  children: React.ReactNode; 
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
      {hint && <span className="text-muted-foreground font-normal ml-1">{hint}</span>}
    </label>
  );
}

// Text input with search icon
function SearchInput({ 
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  inputRef
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
        placeholder={placeholder}
      />
    </div>
  );
}

// Standard text input
function TextInput({ 
  className, 
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm",
        "placeholder:text-muted-foreground/60",
        "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20",
        "transition-colors",
        className
      )}
      {...props}
    />
  );
}

// Contact method toggle button
function ContactToggle({
  method,
  label,
  isSelected,
  onToggle
}: {
  method: string;
  label: string;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        isSelected
          ? "bg-primary text-primary-foreground"
          : "border border-border text-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}

export default function NewWalkinOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addOrder = useDashboardStore((s) => s.addOrder);
  const customers = useDashboardStore((s) => s.customers);
  const products = useDashboardStore((s) => s.products);
  const quotations = useDashboardStore((s) => s.quotations);
  const sourceQuotation = quotations.find(
    (quotation) => quotation.id === searchParams.get("quotationId"),
  );

  const [customerName, setCustomerName] = useState(sourceQuotation?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(sourceQuotation?.customerPhone ?? "");
  const [preferredContact, setPreferredContact] = useState<string[]>(
    sourceQuotation?.preferredContact?.length ? sourceQuotation.preferredContact : ["WhatsApp"],
  );
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLDivElement>(null);

  const matchingCustomers = useMemo(() => {
    if (!customerName.trim()) return [];
    const q = customerName.toLowerCase();
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.phone.includes(q),
    ).slice(0, 8);
  }, [customerName, customers]);

  const selectCustomer = useCallback((c: typeof customers[0]) => {
    setCustomerName(c.fullName);
    setCustomerPhone(c.phone);
    setPreferredContact(Array.isArray(c.preferredContact) ? c.preferredContact : [c.preferredContact || "WhatsApp"]);
    setShowCustomerSearch(false);
  }, []);

  const [items, setItems] = useState<LineItem[]>([
    ...(sourceQuotation?.items?.length
      ? sourceQuotation.items.map((item) => ({ ...item }))
      : [{ name: "", quantity: 1, unitPriceCents: 0 }]),
  ]);

  const [recordPayment, setRecordPayment] = useState(false);
  const [paymentAmountCents, setPaymentAmountCents] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("BankTransfer");
  const [paymentNote, setPaymentNote] = useState("");

  const [activeProductSearch, setActiveProductSearch] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, unitPriceCents: 0 }]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const selectProduct = (idx: number, name: string, unitPriceCents: number, sku?: string) => {
    setItems((currentItems) =>
      currentItems.map((item, i) =>
        i === idx ? { ...item, name, unitPriceCents, sku } : item,
      ),
    );
    setActiveProductSearch(null);
  };

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + (item.name.trim() ? item.quantity : 0), 0);

  const canSubmit =
    customerName.trim().length >= 2 &&
    customerPhone.trim().length >= 5 &&
    itemCount > 0 &&
    subtotalCents > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const newOrder = addOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        preferredContact: preferredContact.length > 0 ? preferredContact : ["WhatsApp"],
        itemCount,
        subtotalCents,
        items: items.filter((item) => item.name.trim() && item.quantity > 0 && item.unitPriceCents > 0),
        payment: recordPayment && paymentAmountCents > 0
          ? {
              amountCents: paymentAmountCents,
              method: paymentMethod,
              note: paymentNote || undefined,
            }
          : undefined,
      });

      toast.success(`Order ${newOrder.orderNumber} created`);
      router.push(`/dashboard/orders/${newOrder.id}/receipt`);
    } catch (err) {
      toast.error("Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle contact method
  const toggleContact = (method: string) => {
    setPreferredContact(prev =>
      prev.includes(method)
        ? prev.filter(c => c !== method)
        : [...prev, method]
    );
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Orders
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {sourceQuotation ? `Create Order from ${sourceQuotation.quotationNumber}` : "New Walk-in Order"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {sourceQuotation
            ? "Quotation details are prefilled. Review and edit anything needed before creating the order."
            : "Record an in-store or WhatsApp purchase manually."}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-5"
      >
        {/* Customer Details */}
        <SectionCard className="p-5">
          <SectionHeader icon={User} title="Customer Details" />
          
          <div className="space-y-4">
            {/* Full Name */}
            <div ref={customerSearchRef} className="relative">
              <FieldLabel required>Full Name</FieldLabel>
              <SearchInput
                inputRef={customerInputRef}
                value={customerName}
                onChange={(value) => {
                  setCustomerName(value);
                  setShowCustomerSearch(true);
                }}
                onFocus={() => setShowCustomerSearch(true)}
                onBlur={() => setTimeout(() => setShowCustomerSearch(false), 200)}
                placeholder="Search existing customer or type new name"
              />
              
              {/* Customer search dropdown */}
              {showCustomerSearch && matchingCustomers.length > 0 && (
                <div className="absolute z-50 mt-1.5 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                  {matchingCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectCustomer(c);
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors border-b border-border last:border-0"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-primary text-xs font-semibold">
                        {c.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{c.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.phone} &middot; {Array.isArray(c.preferredContact) ? c.preferredContact.join(", ") : c.preferredContact}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}
                      </div>
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone and Preferred Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Phone</FieldLabel>
                <TextInput
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0814942473"
                />
              </div>
              <div>
                <FieldLabel hint="(select all that apply)">Preferred Contact</FieldLabel>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <ContactToggle
                    method="WhatsApp"
                    label="WhatsApp"
                    isSelected={preferredContact.includes("WhatsApp")}
                    onToggle={() => toggleContact("WhatsApp")}
                  />
                  <ContactToggle
                    method="Phone"
                    label="Phone Call"
                    isSelected={preferredContact.includes("Phone")}
                    onToggle={() => toggleContact("Phone")}
                  />
                  <ContactToggle
                    method="Email"
                    label="Email"
                    isSelected={preferredContact.includes("Email")}
                    onToggle={() => toggleContact("Email")}
                  />
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Items */}
        <SectionCard className="p-5">
          <SectionHeader 
            icon={ShoppingBag} 
            title="Items"
            action={
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            }
          />

          {/* Items Table Header */}
          <div className="grid grid-cols-12 gap-3 mb-2 px-1">
            <div className="col-span-5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Item Name
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Qty
              </span>
            </div>
            <div className="col-span-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Price
              </span>
            </div>
            <div className="col-span-1" />
          </div>

          {/* Items List */}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-3 items-start relative"
              >
                {/* Item Name with Search */}
                <div className="col-span-5 relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      value={item.name}
                      onChange={(e) => {
                        updateItem(idx, "name", e.target.value);
                        setActiveProductSearch(idx);
                      }}
                      onFocus={() => setActiveProductSearch(idx)}
                      onBlur={() => setTimeout(() => setActiveProductSearch(null), 200)}
                      className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                      placeholder="Search product or type name"
                    />
                  </div>
                  
                  {/* Product search dropdown */}
                  {activeProductSearch === idx && (() => {
                    const q = item.name.toLowerCase();
                    const matches = products.filter(
                      (p) =>
                        p.name.toLowerCase().includes(q) ||
                        (p.sku && p.sku.toLowerCase().includes(q)),
                    ).slice(0, 6);
                    if (!q || matches.length === 0) return null;
                    return (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                        {matches.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectProduct(idx, p.name, p.priceCents, p.sku);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted transition-colors border-b border-border last:border-0"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">{p.name}</p>
                              <p className="text-muted-foreground">
                                {p.sku && <>{p.sku} &middot; </>}
                                {p.brand}
                              </p>
                            </div>
                            <span className="font-semibold text-foreground whitespace-nowrap">{formatCents(p.priceCents)}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Quantity */}
                <div className="col-span-2">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(idx, "quantity", parseInt(e.target.value) || 1)
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                {/* Price */}
                <div className="col-span-4">
                  <MoneyInput
                    value={item.unitPriceCents}
                    onChange={(v) => updateItem(idx, "unitPriceCents", v)}
                    className="h-10"
                  />
                </div>

                {/* Remove Button */}
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
            <span className="text-sm text-muted-foreground">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
            <span className="text-xl font-bold text-foreground">
              {formatCents(subtotalCents)}
            </span>
          </div>
        </SectionCard>

        {/* Payment */}
        <SectionCard className="p-5">
          <SectionHeader 
            icon={CreditCard} 
            title="Payment"
            action={
              <DesertCheckbox
                checked={recordPayment}
                onChange={(e) => setRecordPayment(e.target.checked)}
                label={<span className="text-sm text-muted-foreground">Record payment now</span>}
              />
            }
          />

          {recordPayment ? (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Amount
                  </label>
                  <MoneyInput
                    value={paymentAmountCents}
                    onChange={setPaymentAmountCents}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Method
                  </label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-10 text-sm rounded-lg border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border shadow-lg z-[80]">
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m} className="text-sm cursor-pointer focus:bg-accent">
                          {m === "BankTransfer" ? "Bank Transfer" : m === "PhoneTransfer" ? "Phone Transfer" : m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Note <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <TextInput
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="e.g. Cash at store"
                  />
                </div>
              </div>
              
              {/* Payment summary */}
              {paymentAmountCents > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Total: <strong className="text-foreground">{formatCents(subtotalCents)}</strong></span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className={paymentAmountCents >= subtotalCents ? "text-success" : "text-foreground"}>
                    {paymentAmountCents >= subtotalCents ? "Paid in full" : `Deposit: ${formatCents(paymentAmountCents)}`}
                  </span>
                  {paymentAmountCents > 0 && paymentAmountCents < subtotalCents && (
                    <span className="text-destructive">
                      (Balance: {formatCents(subtotalCents - paymentAmountCents)})
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              A receipt will still be generated showing the amount due. Payment can be recorded later from the order detail page.
            </p>
          )}
        </SectionCard>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl",
            "bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground",
            "hover:bg-primary/90 active:scale-[0.98]",
            "transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          )}
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Create Order
            </>
          )}
        </button>

        <p className="text-xs text-center text-muted-foreground">
          The order will be created with a generated order number and you&apos;ll be taken to the receipt page.
        </p>
      </form>
    </div>
  );
}
