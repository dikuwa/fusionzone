import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  storeSettings as initialSettings,
} from "@/lib/dashboard-data";
import type {
  DashboardOrder,
  DashboardProduct,
  DashboardCustomer,
  DashboardCategory,
  DashboardBrand,
  DashboardPromotion,
  DashboardStaff,
  DashboardFollowUp,
  DashboardNotification,
  DashboardPayment,
  DashboardQuotation,
  DashboardBackInStockRequest,
  BackInStockStatus,
  OrderContactStatus,
  OrderTimelineEvent,
  BankDetail,
  ContactDetail,
  PaymentMethod,
  AuditEntry,
} from "@/lib/dashboard-data";

let nextOrderId = 11;
let nextQuotationId = 1;
let nextProductId = 20;
let nextCategoryId = 10;
let nextPromotionId = 10;
let nextStaffId = 10;
let nextFollowUpId = 10;
let nextBackInStockId = 10;
let nextBrandId = 14;
let nextPaymentId = 10;
let nextContactDetailId = 10;
let nextBankDetailId = 10;
let nextPaymentMethodId = 10;
let nextInviteId = 10;

interface DashboardState {
  // Data
  orders: DashboardOrder[];
  products: DashboardProduct[];
  customers: DashboardCustomer[];
  categories: DashboardCategory[];
  promotions: DashboardPromotion[];
  syncPromotions: (promotions: DashboardPromotion[]) => void;
  staff: DashboardStaff[];
  followUps: DashboardFollowUp[];
  notifications: DashboardNotification[];
  quotations: DashboardQuotation[];
  syncDashboardData: (data: Partial<Pick<DashboardState, "orders" | "customers" | "followUps" | "quotations" | "payments" | "navOrder">>) => void;
  payments: DashboardPayment[];
  contactDetails: ContactDetail[];
  bankDetails: BankDetail[];
  paymentMethods: PaymentMethod[];
  settings: typeof initialSettings;
  userRole: "Admin" | "Staff";
  currentUser: string;
  invites: { token: string; email: string; name: string; role: string; createdAt: string; usedAt?: string }[];

  // Products CRUD
  addProduct: (p: Omit<DashboardProduct, "id" | "createdAt" | "slug">) => void;
  updateProduct: (id: string, data: Partial<DashboardProduct>) => void;
  deleteProduct: (id: string) => void;
  syncProducts: (products: DashboardProduct[]) => void;

  // Categories CRUD
  addCategory: (c: Omit<DashboardCategory, "id" | "slug" | "productCount">) => void;
  updateCategory: (id: string, data: Partial<DashboardCategory>) => void;
  deleteCategory: (id: string) => void;
  syncCategories: (categories: DashboardCategory[]) => void;
  reorderCategory: (id: string, newOrder: number) => void;
  toggleCategoryActive: (id: string) => void;

  // Brands CRUD
  brands: DashboardBrand[];
  addBrand: (b: Omit<DashboardBrand, "id" | "slug">) => void;
  updateBrand: (id: string, data: Partial<DashboardBrand>) => void;
  deleteBrand: (id: string) => void;
  syncBrands: (brands: DashboardBrand[]) => void;
  toggleBrandActive: (id: string) => void;

  // Promotions CRUD
  addPromotion: (p: Omit<DashboardPromotion, "id" | "slug" | "productCount">) => void;
  updatePromotion: (id: string, data: Partial<DashboardPromotion>) => void;
  deletePromotion: (id: string) => void;
  togglePromotionActive: (id: string) => void;

  // Orders
  addOrder: (o: {
    customerName: string;
    customerPhone: string;
    preferredContact: string[];
    itemCount: number;
    subtotalCents: number;
    items?: { name: string; quantity: number; unitPriceCents: number; sku?: string }[];
    payment?: { amountCents: number; method: string; note?: string };
    fulfillmentMethod?: "collection" | "courier";
    courierFeeCents?: number;
    shipping?: {
      recipientName: string;
      phone: string;
      address: string;
      city: string;
      region: string;
      deliveryNotes?: string;
    };
  }) => DashboardOrder;
  updateOrderContactStatus: (id: string, contactStatus: OrderContactStatus) => void;
  updateOrderPaymentStatus: (id: string, paymentStatus: string) => void;
  updateOrderFulfillmentStatus: (id: string, fulfillmentStatus: string) => void;
  resetOrderStatuses: (id: string) => void;
  deleteOrder: (id: string) => void;
  addPayment: (p: Omit<DashboardPayment, "id" | "recordedAt">) => void;
  addNotification: (n: Omit<DashboardNotification, "id" | "createdAt" | "isRead">) => void;

  // Follow-ups
  addFollowUp: (f: Omit<DashboardFollowUp, "id" | "createdAt">) => void;
  markFollowUpDone: (id: string) => void;
  reopenFollowUp: (id: string) => void;

  // Staff
  addStaff: (s: Omit<DashboardStaff, "id" | "createdAt">) => void;
  updateStaff: (id: string, data: Partial<DashboardStaff>) => void;
  toggleStaffActive: (id: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;

  // Settings
  updateSettings: (data: Partial<typeof initialSettings>) => void;
  syncSettings: (data: Partial<typeof initialSettings>) => void;

  // Contact Details CRUD
  addContactDetail: (c: Omit<ContactDetail, "id">) => void;
  updateContactDetail: (id: string, data: Partial<ContactDetail>) => void;
  deleteContactDetail: (id: string) => void;

  // Bank Details CRUD
  addBankDetail: (b: Omit<BankDetail, "id">) => void;
  updateBankDetail: (id: string, data: Partial<BankDetail>) => void;
  deleteBankDetail: (id: string) => void;

  // Payment Methods CRUD
  addPaymentMethod: (p: Omit<PaymentMethod, "id">) => void;
  updatePaymentMethod: (id: string, data: Partial<PaymentMethod>) => void;
  deletePaymentMethod: (id: string) => void;
  movePaymentMethod: (id: string, direction: "up" | "down") => void;
  moveContactDetail: (id: string, direction: "up" | "down") => void;
  moveBankDetail: (id: string, direction: "up" | "down") => void;

  // Staff
  updateStaffRole: (id: string, role: string) => void;

  // Audit Log
  auditLogs: AuditEntry[];
  addAuditLog: (entry: Omit<AuditEntry, "id" | "timestamp" | "performedBy">) => void;

  // Navigation order
  navOrder: string[];
  setNavOrder: (order: string[]) => void;

  // Invites
  addInvite: (invite: { token: string; email: string; name: string; role: string; createdAt: string }) => void;
  markInviteUsed: (token: string) => void;

  // Back-In-Stock Requests
  backInStockRequests: DashboardBackInStockRequest[];
  addBackInStockRequest: (r: Omit<DashboardBackInStockRequest, "id" | "createdAt" | "updatedAt" | "status">) => void;
  updateBackInStockStatus: (id: string, status: BackInStockStatus) => void;
  deleteBackInStockRequest: (id: string) => void;
  markBackInStockReadyForProduct: (productId: string, productName: string) => void;
  syncBackInStockRequests: (requests: DashboardBackInStockRequest[]) => void;

  // Quotations
  addQuotation: (q: {
    customerName: string;
    customerPhone: string;
    preferredContact: string[];
    items: { name: string; quantity: number; unitPriceCents: number }[];
    subtotalCents: number;
    notes?: string;
  }) => DashboardQuotation;
  updateQuotation: (id: string, data: Partial<Pick<DashboardQuotation, "customerName" | "customerPhone" | "preferredContact" | "items" | "subtotalCents" | "notes">>) => void;
  updateQuotationStatus: (id: string, status: DashboardQuotation["status"]) => void;
  deleteQuotation: (id: string) => void;

  // Customers
  addCustomer: (c: Omit<DashboardCustomer, "id" | "createdAt" | "orderCount" | "totalSpentCents" | "preferredContact"> & { preferredContact?: string[] }) => void;
  updateCustomer: (id: string, data: Partial<DashboardCustomer>) => void;
  deleteCustomer: (id: string) => void;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function createOrderEvent(
  stage: OrderTimelineEvent["stage"],
  status: string,
  label: string,
  createdAt = new Date().toISOString(),
): OrderTimelineEvent {
  return {
    id: `${stage.toLowerCase()}-${createdAt}-${Math.random().toString(36).slice(2, 7)}`,
    stage,
    status,
    label,
    createdAt,
  };
}

function syncContactSettings(
  details: ContactDetail[],
  settings: typeof initialSettings,
): typeof initialSettings {
  const firstActive = (type: ContactDetail["type"]) =>
    details.find((cd) => cd.type === type && cd.isActive);
  const phone = firstActive("phone");
  const whatsapp = firstActive("whatsapp");
  const email = firstActive("email");
  const address = firstActive("address");
  return {
    ...settings,
    phone: phone?.value ?? settings.phone,
    whatsapp: whatsapp?.value ?? settings.whatsapp,
    email: email?.value ?? settings.email,
    address: address?.value ?? settings.address,
  };
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({

      orders: [],
      products: [],
      customers: [],
      categories: [],
      promotions: [],
      staff: [],
      followUps: [],
      notifications: [],
      quotations: [],
      brands: [],
      payments: [],
      contactDetails: [],
      bankDetails: [],
      paymentMethods: [],
      settings: initialSettings,
      backInStockRequests: [],
      userRole: "Admin",
      currentUser: "Admin User",
      invites: [],
      auditLogs: [],
      navOrder: ["/dashboard", "/dashboard/orders", "/dashboard/products", "/dashboard/categories", "/dashboard/promotions", "/dashboard/customers", "/dashboard/follow-ups", "/dashboard/receipts", "/dashboard/quotations", "/dashboard/notifications", "/dashboard/back-in-stock"],

      // === Settings ===
      syncSettings: (data) => set((s) => {
        const settings = { ...s.settings, ...data };
        return {
          settings,
          contactDetails: data.contactDetails ?? [
            { id: "settings-phone", type: "phone", label: "Main", value: settings.phone, isActive: Boolean(settings.phone) },
            { id: "settings-whatsapp", type: "whatsapp", label: "Sales", value: settings.whatsapp, isActive: Boolean(settings.whatsapp) },
            { id: "settings-email", type: "email", label: "General", value: settings.email, isActive: Boolean(settings.email) },
            { id: "settings-address", type: "address", label: "Physical", value: settings.address, isActive: Boolean(settings.address) },
          ],
          bankDetails: data.bankDetails ?? (settings.bankName ? [{
            id: "settings-bank",
            bankName: settings.bankName,
            accountName: settings.bankAccountName,
            accountNumber: settings.bankAccountNumber,
            branchCode: settings.bankBranchCode,
            isActive: true,
          }] : []),
          paymentMethods: data.paymentMethods ?? s.paymentMethods,
        };
      }),
      syncDashboardData: (data) => set(data),
      updateSettings: (data) => {
        const changedFields = Object.keys(data).join(", ");
        set((s) => {
          const updatedSettings = { ...s.settings, ...data };
          // Sync settings fields back to contact details if they changed
          const fieldToContactType: Record<string, ContactDetail["type"]> = {
            phone: "phone",
            whatsapp: "whatsapp",
            email: "email",
            address: "address",
          };
          let updatedDetails = [...s.contactDetails];
          for (const [field, contactType] of Object.entries(fieldToContactType)) {
            if (field in data) {
              const existing = updatedDetails.find((cd) => cd.type === contactType);
              if (existing) {
                const val = data[field as keyof typeof data];
                updatedDetails = updatedDetails.map((cd) =>
                  cd.id === existing.id ? { ...cd, value: val != null ? String(val) : "" } : cd,
                );
              }
            }
          }
          return { settings: updatedSettings, contactDetails: updatedDetails };
        });
        get().addAuditLog({ action: `Settings updated: ${changedFields}`, entityType: "settings", entityId: "store-settings", entityLabel: "Store Settings" });
      },

      // === Contact Details ===
      moveContactDetail: (id, direction) =>
        set((s) => {
          const idx = s.contactDetails.findIndex((cd) => cd.id === id);
          if (idx === -1) return s;
          const newIdx = direction === "up" ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= s.contactDetails.length) return s;
          const items = [...s.contactDetails];
          [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
          return { contactDetails: items };
        }),
      addContactDetail: (c) => {
        const id = `cd${nextContactDetailId++}`;
        set((s) => {
          const newDetails = [...s.contactDetails, { ...c, id }];
          return { contactDetails: newDetails, settings: syncContactSettings(newDetails, s.settings) };
        });
      },
      updateContactDetail: (id, data) =>
        set((s) => {
          const newDetails = s.contactDetails.map((cd) =>
            cd.id === id ? { ...cd, ...data } : cd
          );
          return { contactDetails: newDetails, settings: syncContactSettings(newDetails, s.settings) };
        }),
      deleteContactDetail: (id) =>
        set((s) => {
          const newDetails = s.contactDetails.filter((cd) => cd.id !== id);
          return { contactDetails: newDetails, settings: syncContactSettings(newDetails, s.settings) };
        }),

      // === Bank Details ===
      moveBankDetail: (id, direction) =>
        set((s) => {
          const idx = s.bankDetails.findIndex((bd) => bd.id === id);
          if (idx === -1) return s;
          const newIdx = direction === "up" ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= s.bankDetails.length) return s;
          const items = [...s.bankDetails];
          [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
          return { bankDetails: items };
        }),
      addBankDetail: (b) => {
        const id = `bd${nextBankDetailId++}`;
        set((s) => ({
          bankDetails: [...s.bankDetails, { ...b, id }],
        }));
      },
      updateBankDetail: (id, data) =>
        set((s) => ({
          bankDetails: s.bankDetails.map((bd) =>
            bd.id === id ? { ...bd, ...data } : bd
          ),
        })),
      deleteBankDetail: (id) =>
        set((s) => ({
          bankDetails: s.bankDetails.filter((bd) => bd.id !== id),
        })),

      // === Payment Methods ===
      addPaymentMethod: (p) => {
        const id = `pm${nextPaymentMethodId++}`;
        set((s) => ({
          paymentMethods: [{ ...p, id }, ...s.paymentMethods],
        }));
      },
      movePaymentMethod: (id, direction) =>
        set((s) => {
          const idx = s.paymentMethods.findIndex((pm) => pm.id === id);
          if (idx === -1) return s;
          const newIdx = direction === "up" ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= s.paymentMethods.length) return s;
          const items = [...s.paymentMethods];
          [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
          return { paymentMethods: items };
        }),
      updatePaymentMethod: (id, data) =>
        set((s) => ({
          paymentMethods: s.paymentMethods.map((pm) =>
            pm.id === id ? { ...pm, ...data } : pm
          ),
        })),
      deletePaymentMethod: (id) =>
        set((s) => ({
          paymentMethods: s.paymentMethods.filter((pm) => pm.id !== id),
        })),

      // === Navigation Order ===
      setNavOrder: (order) => set({ navOrder: order }),

      // === Staff ===
      updateStaff: (id, data) => {
        const { staff } = get();
        const member = staff.find((m) => m.id === id);
        set((s) => ({
          staff: s.staff.map((m) => (m.id === id ? { ...m, ...data } : m)),
        }));
        if (member) get().addAuditLog({ action: "Staff updated", entityType: "staff", entityId: id, entityLabel: member.name });
      },
      updateStaffRole: (id, role) => {
        const { staff } = get();
        const member = staff.find((m) => m.id === id);
        set((s) => ({
          staff: s.staff.map((m) => (m.id === id ? { ...m, role } : m)),
        }));
        if (member) get().addAuditLog({ action: `Staff role: ${role}`, entityType: "staff", entityId: id, entityLabel: member.name });
      },

      // === Audit Log ===
      addAuditLog: (entry) => {
        const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const { currentUser } = get();
        const newEntry: AuditEntry = {
          ...entry,
          id,
          performedBy: currentUser,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({
          auditLogs: [newEntry, ...s.auditLogs],
        }));
      },

      // === Invites ===
      addInvite: (invite) =>
        set((s) => ({
          invites: [invite, ...s.invites],
        })),
      markInviteUsed: (token) =>
        set((s) => ({
          invites: s.invites.map((i) =>
            i.token === token ? { ...i, usedAt: new Date().toISOString() } : i
          ),
        })),

      // === Products ===
      syncProducts: (products) => {
        set({ products });
      },
      addProduct: (p) => {
        const id = `p${nextProductId++}`;
        // Server-side SKU uniqueness validation
        // If SKU already exists, strip it to force the caller to choose a unique one
        let sku = p.sku;
        if (sku) {
          const { products: existing } = get();
          if (existing.some((ep) => ep.sku === sku)) {
            console.warn(`[store] SKU "${sku}" already exists — clearing SKU to prevent duplicate.`);
            sku = undefined;
          }
        }
        const newProduct: DashboardProduct = {
          ...p,
          id,
          sku,
          slug: slugify(p.name),
          createdAt: new Date().toISOString().split("T")[0],
        };
        set((s) => ({ products: [newProduct, ...s.products] }));
        // Update category product count
        set((s) => ({
          categories: s.categories.map((c) =>
            c.name === p.category ? { ...c, productCount: c.productCount + 1 } : c
          ),
        }));
        get().addAuditLog({ action: "Product created", entityType: "product", entityId: newProduct.id, entityLabel: newProduct.name });
      },
      updateProduct: (id, data) =>
        set((s) => {
          const oldProduct = s.products.find((p) => p.id === id);
          const wasOutOfStock =
            oldProduct?.availability === "OutOfStock" ||
            (oldProduct?.stockQuantity ?? 0) <= 0;
          const nowInStock =
            (data.availability === "InStock" || data.availability === "LowStock") ||
            (data.stockQuantity !== undefined && data.stockQuantity > 0);

          // SKU uniqueness check on update
          if (data.sku && oldProduct && data.sku !== oldProduct.sku) {
            if (s.products.some((ep) => ep.id !== id && ep.sku === data.sku)) {
              console.warn(`[store] SKU "${data.sku}" already exists — clearing SKU from update to prevent duplicate.`);
              data.sku = undefined;
            }
          }

          const result: Partial<DashboardState> = {
            products: s.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
          };

          // Stock-return trigger: if product was out of stock and now has stock
          if (wasOutOfStock && nowInStock) {
            const productName = data.name || oldProduct?.name || "";
            const updatedRequests = s.backInStockRequests.map((r) =>
              r.productId === id && r.status === "New"
                ? { ...r, status: "ReadyToContact" as const, updatedAt: new Date().toISOString() }
                : r,
            );
            const changedCount = updatedRequests.filter(
              (r, i) =>
                r.status === "ReadyToContact" &&
                s.backInStockRequests[i]?.status === "New",
            ).length;

            if (changedCount > 0) {
              const maxId = s.notifications.reduce((max, n) => {
                const match = n.id.match(/^n(\d+)$/);
                return match ? Math.max(max, parseInt(match[1]) + 1) : max;
              }, 10);
              const newNotif: DashboardNotification = {
                id: `n${maxId}`,
                type: "stock",
                title: "Stock Restored",
                message: `${changedCount} customer${changedCount > 1 ? "s" : ""} requested ${productName}. Stock is now available.`,
                isRead: false,
                createdAt: new Date().toISOString(),
              };
              result.notifications = [newNotif, ...s.notifications];
              result.backInStockRequests = updatedRequests;
            }
          }

          return result;
        }),
      deleteProduct: (id) => {
        const { products } = get();
        const product = products.find((p) => p.id === id);
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
        }));
        if (product) get().addAuditLog({ action: "Product deleted", entityType: "product", entityId: id, entityLabel: product.name });
      },

      // === Categories ===
      syncCategories: (categories) => set({ categories }),
      addCategory: (c) => {
        const id = `cat${nextCategoryId++}`;
        const newCat: DashboardCategory = {
          ...c,
          id,
          slug: slugify(c.name),
          productCount: 0,
        };
        set((s) => ({ categories: [...s.categories, newCat] }));
      },
      updateCategory: (id, data) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
        })),
      reorderCategory: (id, newOrder) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, sortOrder: newOrder } : c
          ),
        })),
      toggleCategoryActive: (id) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, isActive: !c.isActive } : c
          ),
        })),

      // === Brands ===
      syncBrands: (brands) => set({ brands }),
      addBrand: (b) => {
        const id = `br${nextBrandId++}`;
        const newBrand: DashboardBrand = {
          ...b,
          id,
          slug: slugify(b.name),
        };
        set((s) => ({ brands: [...s.brands, newBrand] }));
        get().addAuditLog({ action: "Brand created", entityType: "brand", entityId: id, entityLabel: newBrand.name });
      },
      updateBrand: (id, data) => {
        const { brands } = get();
        const brand = brands.find((b) => b.id === id);
        set((s) => ({
          brands: s.brands.map((br) => (br.id === id ? { ...br, ...data } : br)),
        }));
        if (brand) get().addAuditLog({ action: "Brand updated", entityType: "brand", entityId: id, entityLabel: brand.name });
      },
      deleteBrand: (id) => {
        const { brands } = get();
        const brand = brands.find((b) => b.id === id);
        set((s) => ({
          brands: s.brands.filter((br) => br.id !== id),
        }));
        if (brand) get().addAuditLog({ action: "Brand deleted", entityType: "brand", entityId: id, entityLabel: brand.name });
      },
      toggleBrandActive: (id) =>
        set((s) => ({
          brands: s.brands.map((br) =>
            br.id === id ? { ...br, isActive: !br.isActive } : br
          ),
        })),

      // === Promotions ===
      syncPromotions: (promotions) => set({ promotions }),
      addPromotion: (p) => {
        const id = `pr${nextPromotionId++}`;
        const newPromo: DashboardPromotion = {
          ...p,
          id,
          slug: slugify(p.title),
          productCount: 0,
        };
        set((s) => ({ promotions: [newPromo, ...s.promotions] }));
      },
      updatePromotion: (id, data) =>
        set((s) => ({
          promotions: s.promotions.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deletePromotion: (id) =>
        set((s) => ({
          promotions: s.promotions.filter((p) => p.id !== id),
        })),
      togglePromotionActive: (id) =>
        set((s) => ({
          promotions: s.promotions.map((p) =>
            p.id === id ? { ...p, isActive: !p.isActive } : p
          ),
        })),

      // === Orders ===
      addOrder: (o) => {
        const id = `o${nextOrderId++}`;
        const orderNumber = `${get().settings.receiptPrefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const now = new Date().toISOString();
        const paymentStatus: DashboardOrder["paymentStatus"] = o.payment
          ? o.payment.amountCents >= o.subtotalCents
            ? "PaidInFull"
            : "DepositPaid"
          : "Unpaid";

        const newOrder: DashboardOrder = {
          id,
          orderNumber,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          itemCount: o.itemCount,
          subtotalCents: o.subtotalCents,
          contactStatus: "NotContacted",
          paymentStatus,
          fulfillmentStatus: "Pending",
          preferredContact: Array.isArray(o.preferredContact) ? o.preferredContact : [o.preferredContact || "WhatsApp"],
          createdAt: now,
          updatedAt: now,
          paymentStatusAt: o.payment ? now : undefined,
          fulfillmentMethod: o.fulfillmentMethod,
          courierFeeCents: o.courierFeeCents,
          shipping: o.shipping,
          items: o.items,
          timelineEvents: [
            createOrderEvent("Order", "Created", "Order created", now),
            ...(o.payment
              ? [createOrderEvent("Payment", paymentStatus, paymentStatus === "PaidInFull" ? "Paid in full" : "Deposit paid", now)]
              : []),
          ],
        };

        set((s) => ({
          orders: [newOrder, ...s.orders],
        }));

        // Record payment if provided
        if (o.payment) {
          get().addPayment({
            orderNumber: newOrder.orderNumber,
            customerName: o.customerName,
            amountCents: o.payment.amountCents,
            method: o.payment.method,
            status: "Confirmed",
            note: o.payment.note,
          });
        }

        // Create notification
        get().addNotification({
          type: "order",
          title: o.payment ? "New Walk-in Order + Payment" : "New Walk-in Order",
          message: `${o.customerName} — ${newOrder.orderNumber}${o.payment ? ` — ${paymentStatus === "PaidInFull" ? "Paid in full" : "Deposit received"}` : ""}`,
        });

        get().addAuditLog({ action: "Order created", entityType: "order", entityId: id, entityLabel: orderNumber });

        return newOrder;
      },
      updateOrderContactStatus: (id, contactStatus) => {
        const { orders } = get();
        const order = orders.find((o) => o.id === id);
        if (!order) return;
        const now = new Date().toISOString();
        const label = contactStatus === "Contacted" ? "Customer contacted" : "Contact reset";
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? (() => {
                  return {
                    ...o,
                    contactStatus: contactStatus as DashboardOrder["contactStatus"],
                    contactStatusAt: now,
                    updatedAt: now,
                    timelineEvents: [
                      createOrderEvent("Contact", contactStatus, label, now),
                      ...(o.timelineEvents ?? []),
                    ],
                  };
                })()
              : o
          ),
        }));
        get().addAuditLog({ action: label, entityType: "order", entityId: id, entityLabel: order.orderNumber });
      },
      updateOrderPaymentStatus: (id, paymentStatus) => {
        const { orders } = get();
        const order = orders.find((o) => o.id === id);
        if (!order) return;
        const now = new Date().toISOString();
        const label = paymentStatus === "PaidInFull" ? "Paid in full" : paymentStatus === "DepositPaid" ? "Deposit paid" : "Awaiting payment";
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? (() => {
                  return {
                    ...o,
                    paymentStatus: paymentStatus as DashboardOrder["paymentStatus"],
                    paymentStatusAt: now,
                    updatedAt: now,
                    timelineEvents: [createOrderEvent("Payment", paymentStatus, label, now), ...(o.timelineEvents ?? [])],
                  };
                })()
              : o
          ),
        }));
        get().addAuditLog({ action: label, entityType: "order", entityId: id, entityLabel: order.orderNumber });
      },
      updateOrderFulfillmentStatus: (id, fulfillmentStatus) => {
        const { orders } = get();
        const order = orders.find((o) => o.id === id);
        if (!order) return;
        const now = new Date().toISOString();
        const label =
          fulfillmentStatus === "ReadyForCollection" ? "Ready for collection" :
          fulfillmentStatus === "Completed" ? "Order completed" :
          fulfillmentStatus === "Cancelled" ? "Order cancelled" : "Processing";
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? (() => {
                  return {
                    ...o,
                    fulfillmentStatus: fulfillmentStatus as DashboardOrder["fulfillmentStatus"],
                    fulfillmentStatusAt: now,
                    updatedAt: now,
                    timelineEvents: [createOrderEvent("Fulfillment", fulfillmentStatus, label, now), ...(o.timelineEvents ?? [])],
                  };
                })()
              : o
          ),
        }));
        get().addAuditLog({ action: label, entityType: "order", entityId: id, entityLabel: order.orderNumber });
      },
      resetOrderStatuses: (id) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  contactStatus: "NotContacted" as const,
                  paymentStatus: "Unpaid" as const,
                  fulfillmentStatus: "Pending" as const,
                  contactStatusAt: undefined,
                  paymentStatusAt: undefined,
                  fulfillmentStatusAt: undefined,
                  updatedAt: new Date().toISOString(),
                  timelineEvents: [
                    createOrderEvent("Order", "Restored", "Order restored"),
                    ...(o.timelineEvents ?? []),
                  ],
                }
              : o
          ),
        })),
      deleteOrder: (id) =>
        set((s) => {
          const order = s.orders.find((o) => o.id === id);
          return {
            orders: s.orders.filter((o) => o.id !== id),
            payments: order
              ? s.payments.filter((p) => p.orderNumber !== order.orderNumber)
              : s.payments,
          };
        }),
      addPayment: (p) => {
        const id = `pay${nextPaymentId++}`;
        const newPayment: DashboardPayment = {
          ...p,
          id,
          recordedAt: new Date().toISOString(),
        };
        set((s) => ({ payments: [newPayment, ...s.payments] }));
        get().addAuditLog({ action: `Payment recorded: ${p.method}`, entityType: "payment", entityId: id, entityLabel: `${p.customerName} — ${p.orderNumber}` });
      },
      addNotification: (notif) => {
        // Calculate next ID from existing notifications to avoid collisions after hydration
        const maxId = get().notifications.reduce((max, existing) => {
          const match = existing.id.match(/^n(\d+)$/);
          return match ? Math.max(max, parseInt(match[1]) + 1) : max;
        }, 10);
        const id = `n${maxId}`;
        const newNotif: DashboardNotification = {
          ...notif,
          id,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [newNotif, ...s.notifications] }));
      },

      // === Follow-ups ===
      addFollowUp: (f) => {
        const id = `f${nextFollowUpId++}`;
        set((s) => ({
          followUps: [
            { ...f, id, createdAt: new Date().toISOString() },
            ...s.followUps,
          ],
        }));
      },
      markFollowUpDone: (id) =>
        set((s) => ({
          followUps: s.followUps.map((f) =>
            f.id === id ? { ...f, status: "Done" } : f
          ),
        })),
      reopenFollowUp: (id) =>
        set((s) => ({
          followUps: s.followUps.map((f) =>
            f.id === id ? { ...f, status: "Pending" } : f
          ),
        })),

      // === Staff ===
      addStaff: (s) => {
        const id = `s${nextStaffId++}`;
        const newName = s.name || "New Staff";
        set((state) => ({
          staff: [
            {
              ...s,
              id,
              createdAt: new Date().toISOString().split("T")[0],
            },
            ...state.staff,
          ],
        }));
        get().addAuditLog({ action: "Staff created", entityType: "staff", entityId: id, entityLabel: newName });
      },
      toggleStaffActive: (id) => {
        const { staff } = get();
        const member = staff.find((m) => m.id === id);
        set((s) => ({
          staff: s.staff.map((m) =>
            m.id === id ? { ...m, isActive: !m.isActive } : m
          ),
        }));
        if (member) get().addAuditLog({ action: `Staff ${member.isActive ? "deactivated" : "activated"}`, entityType: "staff", entityId: id, entityLabel: member.name });
      },

      // === Notifications ===
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        })),
      deleteNotification: (id) => {
        const { notifications } = get();
        const notif = notifications.find((n) => n.id === id);
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        }));
        if (notif) get().addAuditLog({ action: "Notification dismissed", entityType: "notification", entityId: id, entityLabel: notif.title });
      },

      // === Back-In-Stock Requests ===
      addBackInStockRequest: (r) => {
        const id = `bis${nextBackInStockId++}`;
        const now = new Date().toISOString();
        const newReq: DashboardBackInStockRequest = {
          ...r,
          id,
          status: "New",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          backInStockRequests: [newReq, ...s.backInStockRequests],
        }));
        // Create dashboard notification
        get().addNotification({
          type: "backinstock",
          title: "New Stock Request",
          message: `${r.customerName} requested ${r.productName}`,
        });
        get().addAuditLog({ action: "Back-in-stock request created", entityType: "backinstock", entityId: id, entityLabel: `${r.customerName} — ${r.productName}` });
      },
      updateBackInStockStatus: (id, status) => {
        const { backInStockRequests } = get();
        const req = backInStockRequests.find((r) => r.id === id);
        set((s) => ({
          backInStockRequests: s.backInStockRequests.map((r) =>
            r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
          ),
        }));
        if (req) get().addAuditLog({ action: `Back-in-stock status: ${status}`, entityType: "backinstock", entityId: id, entityLabel: `${req.customerName} — ${req.productName}` });
      },
      deleteBackInStockRequest: (id) => {
        const { backInStockRequests } = get();
        const req = backInStockRequests.find((r) => r.id === id);
        set((s) => ({
          backInStockRequests: s.backInStockRequests.filter((r) => r.id !== id),
        }));
        if (req) get().addAuditLog({ action: "Back-in-stock request deleted", entityType: "backinstock", entityId: id, entityLabel: `${req.customerName} — ${req.productName}` });
      },
      markBackInStockReadyForProduct: (productId, productName) =>
        set((s) => {
          const now = new Date().toISOString();
          const updated = s.backInStockRequests.map((r) =>
            r.productId === productId && r.status === "New"
              ? { ...r, status: "ReadyToContact" as const, updatedAt: now }
              : r
          );
          const changedCount = updated.filter(
            (r, i) => r.status === "ReadyToContact" && s.backInStockRequests[i]?.status === "New"
          ).length;

          const result: Partial<DashboardState> = { backInStockRequests: updated };

          if (changedCount > 0) {
            const maxId = s.notifications.reduce((max, n) => {
              const match = n.id.match(/^n(\d+)$/);
              return match ? Math.max(max, parseInt(match[1]) + 1) : max;
            }, 10);
            const newNotif: DashboardNotification = {
              id: `n${maxId}`,
              type: "stock",
              title: "Stock Restored",
              message: `${changedCount} customer${changedCount > 1 ? "s" : ""} requested ${productName}. Stock is now available.`,
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            result.notifications = [newNotif, ...s.notifications];
          }

          return result;
        }),
      syncBackInStockRequests: (requests) =>
        set({ backInStockRequests: requests }),

      // === Quotations ===
      addQuotation: (q) => {
        const id = `qtn${nextQuotationId++}`;
        const quotationNumber = `${get().settings.receiptPrefix}-QTN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const now = new Date().toISOString();
        const newQuotation: DashboardQuotation = {
          id,
          quotationNumber,
          customerName: q.customerName,
          customerPhone: q.customerPhone,
          preferredContact: Array.isArray(q.preferredContact) ? q.preferredContact : [q.preferredContact || "WhatsApp"],
          items: q.items,
          subtotalCents: q.subtotalCents,
          notes: q.notes,
          status: "Draft",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ quotations: [newQuotation, ...s.quotations] }));
        get().addAuditLog({ action: "Quotation created", entityType: "quotation", entityId: id, entityLabel: quotationNumber });
        return newQuotation;
      },
      updateQuotation: (id, data) => {
        const { quotations } = get();
        const q = quotations.find((qt) => qt.id === id);
        set((s) => ({
          quotations: s.quotations.map((qt) =>
            qt.id === id
              ? { ...qt, ...data, updatedAt: new Date().toISOString() }
              : qt
          ),
        }));
        if (q) get().addAuditLog({ action: "Quotation updated", entityType: "quotation", entityId: id, entityLabel: q.quotationNumber });
      },
      updateQuotationStatus: (id, status) => {
        const { quotations } = get();
        const q = quotations.find((qt) => qt.id === id);
        set((s) => ({
          quotations: s.quotations.map((qt) =>
            qt.id === id
              ? { ...qt, status, updatedAt: new Date().toISOString() }
              : qt
          ),
        }));
        if (q) get().addAuditLog({ action: `Quotation status: ${status}`, entityType: "quotation", entityId: id, entityLabel: q.quotationNumber });
      },
      deleteQuotation: (id) => {
        const { quotations } = get();
        const q = quotations.find((qt) => qt.id === id);
        set((s) => ({
          quotations: s.quotations.filter((q) => q.id !== id),
        }));
        if (q) get().addAuditLog({ action: "Quotation deleted", entityType: "quotation", entityId: id, entityLabel: q.quotationNumber });
      },

      // === Customers ===
      addCustomer: (c) => {
        let newId = "";
        let fullName = "";
        set((s) => {
          const id = `c${s.customers.length + 10}`;
          newId = id;
          fullName = c.fullName || c.email || id;
          return {
            customers: [
              {
                ...c,
                preferredContact: c.preferredContact || ["WhatsApp"],
                id,
                orderCount: 0,
                totalSpentCents: 0,
                createdAt: new Date().toISOString().split("T")[0],
              },
              ...s.customers,
            ],
          };
        });
        get().addAuditLog({ action: "Customer created", entityType: "customer", entityId: newId, entityLabel: fullName });
      },
      updateCustomer: (id, data) => {
        const { customers } = get();
        const customer = customers.find((c) => c.id === id);
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        }));
        if (customer) get().addAuditLog({ action: "Customer updated", entityType: "customer", entityId: id, entityLabel: customer.fullName });
      },
      deleteCustomer: (id) => {
        const { customers } = get();
        const customer = customers.find((c) => c.id === id);
        set((s) => ({
          customers: s.customers.filter((c) => c.id !== id),
        }));
        if (customer) get().addAuditLog({ action: "Customer deleted", entityType: "customer", entityId: id, entityLabel: customer.fullName });
      },
    }),
    {
      name: "desert-tech-dashboard",
      version: 4,
    },
  ),
);
