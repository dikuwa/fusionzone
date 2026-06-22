export type OrderContactStatus = "NotContacted" | "Contacted";
export type OrderPaymentStatus = "Unpaid" | "DepositPaid" | "PaidInFull";
export type OrderFulfillmentStatus = "Pending" | "ReadyForCollection" | "Completed" | "Cancelled";

export interface OrderTimelineEvent {
  id: string;
  stage: "Contact" | "Payment" | "Fulfillment" | "Order";
  label: string;
  status: string;
  createdAt: string;
}

export interface DashboardOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  itemCount: number;
  subtotalCents: number;
  contactStatus: OrderContactStatus;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  preferredContact: string[];
  createdAt: string;
  updatedAt: string;
  contactStatusAt?: string;
  paymentStatusAt?: string;
  fulfillmentStatusAt?: string;
  timelineEvents?: OrderTimelineEvent[];
  items?: { name: string; quantity: number; unitPriceCents: number; sku?: string }[];
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
}

export interface DashboardOrderDetail extends DashboardOrder {
  items: { name: string; quantity: number; unitPriceCents: number; totalCents: number; sku?: string }[];
  payments: { id: string; amountCents: number; method: string; status: string; note?: string; recordedAt: string }[];
  followUps: { id: string; type: string; status: string; note: string; dueAt?: string; assignedTo?: string }[];
  notes: string;
  email?: string;
  whatsapp?: string;
}

export interface DashboardProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  priceCents: number;
  stockQuantity: number;
  lowStockThreshold: number;
  availability: string;
  condition: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  imageUrl: string;
  sku?: string;
  description?: string;
  warranty?: string;
  compareAtPriceCents?: number;
  images?: string[];
}

export interface DashboardCustomer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  preferredContact: string[];
  orderCount: number;
  totalSpentCents: number;
  lastOrderDate?: string;
  createdAt: string;
}

export interface DashboardCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  isActive: boolean;
  sortOrder: number;
}

export interface DashboardPromotion {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string;
  images?: string[];
  discountLabel?: string;
  placement: string;
  isActive: boolean;
  sortOrder: number;
  startsAt?: string;
  endsAt?: string;
  productCount: number;
  type?: "product" | "bundle" | "service" | "general";
  isFeatured?: boolean;
  linkedProductId?: string;
  linkedCategory?: string;
  serviceSlug?: string;
  ctaLabel?: string;
}

export type ContactType = "phone" | "whatsapp" | "email" | "address";

export interface ContactDetail {
  id: string;
  type: ContactType;
  label: string;
  value: string;
  isActive: boolean;
}

export interface BankDetail {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  isActive: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: "BankTransfer" | "Cash" | "PhoneTransfer" | "Card" | "Other";
  details: string;
  instructions?: string;
  isActive: boolean;
}

export interface DashboardStaff {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  lastActive?: string;
  isActive: boolean;
  createdAt: string;
  password?: string;
}

export interface DashboardFollowUp {
  id: string;
  orderNumber: string;
  customerName: string;
  type: string;
  status: string;
  note: string;
  assignedTo?: string;
  dueAt?: string;
  createdAt: string;
}

export interface DashboardNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export type BackInStockUrgency = "ASAP" | "Flexible" | "JustChecking";
export type BackInStockContactMethod = "WhatsApp" | "Phone" | "Email";
export type BackInStockStatus = "New" | "ReadyToContact" | "Contacted" | "Cancelled";

export interface DashboardBackInStockRequest {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  preferredContact: BackInStockContactMethod[];
  contactValue: string;
  contactValues?: Partial<Record<BackInStockContactMethod, string>>;
  urgency: BackInStockUrgency;
  note?: string;
  status: BackInStockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardQuotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  customerPhone: string;
  preferredContact: string[];
  items: { name: string; quantity: number; unitPriceCents: number; sku?: string }[];
  subtotalCents: number;
  notes?: string;
  status: "Draft" | "Sent" | "Accepted" | "Declined";
  createdAt: string;
  updatedAt: string;
}

export interface DashboardBrand {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  performedBy: string;
  timestamp: string;
  details?: string | {
    metadata?: Record<string, unknown>;
    changedFields?: string[];
  };
}

export interface DashboardPayment {
  id: string;
  orderNumber: string;
  customerName: string;
  amountCents: number;
  method: string;
  status: string;
  note?: string;
  recordedAt: string;
}



export const storeSettings = {
  storeName: "FusionZone",
  phone: "+264 00 000 0000",
  whatsapp: "264000000000",
  email: "sales@fusionzone.example",
  address: "Windhoek, Namibia",
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankBranchCode: "",
  receiptPrefix: "FZ",
  lowStockThreshold: 5,
  currency: "NAD",
  heroHeading: "Namibia&rsquo;s tech — tested, warranted, and a message away.",
  heroSubheading: "Shop laptops, phones, gaming builds, CCTV, networking and POS gear with clear pricing, tested stock and direct local assistance.",
  heroImageUrl: "/images/fusionhero-clean.webp",
  footerDescription:
    "Namibia\u2019s trusted source for new, pre-owned, and refurbished technology products \u2014 laptops, phones, gaming, CCTV, networking, POS & more.",
  contactDetails: [] as ContactDetail[],
  bankDetails: [] as BankDetail[],
  paymentMethods: [] as PaymentMethod[],
};

/**
 * Compute totalPaidCents and balanceDueCents consistently,
 * taking both payment records AND paymentStatus into account.
 *
 * When status is "PaidInFull", the order is treated as fully paid
 * regardless of whether actual payment records exist.
 */
export function computePaymentFields(
  subtotalCents: number,
  paymentStatus: string,
  payments: { amountCents: number }[],
  options?: { courierFeeCents?: number; fulfillmentMethod?: string }
) {
  const orderTotal = subtotalCents + ((options?.fulfillmentMethod === "courier" && options?.courierFeeCents) ? options.courierFeeCents : 0);
  const actualPaid = payments.reduce((sum, p) => sum + p.amountCents, 0);

  let totalPaidCents: number;
  let balanceDueCents: number;

  if (paymentStatus === "PaidInFull") {
    // Treat as fully settled regardless of payment records
    totalPaidCents = Math.max(actualPaid, orderTotal);
    balanceDueCents = 0;
  } else if (paymentStatus === "DepositPaid") {
    totalPaidCents = actualPaid;
    balanceDueCents = Math.max(0, orderTotal - actualPaid);
  } else {
    // Unpaid or fallback
    totalPaidCents = actualPaid;
    balanceDueCents = Math.max(0, orderTotal - actualPaid);
  }

  return { totalPaidCents, balanceDueCents, orderTotal };
}

export function formatCents(cents: number): string {
  return `N$ ${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    NotContacted: "bg-warning-soft text-warning border-warning/20",
    Contacted: "bg-info-soft text-info border-info/20",
    Unpaid: "bg-warning-soft text-warning border-warning/20",
    DepositPaid: "bg-info-soft text-info border-info/20",
    PaidInFull: "bg-success-soft text-success border-success/20",
    Pending: "bg-warning-soft text-warning border-warning/20",
    ReadyForCollection: "bg-success-soft text-success border-success/20",
    Completed: "bg-success-soft text-success border-success/20",
    Cancelled: "bg-gray-100 text-gray-500 border-gray-200",
    Refunded: "bg-gray-100 text-gray-500 border-gray-200",
    Confirmed: "bg-success-soft text-success border-success/20",
    Failed: "bg-destructive/10 text-destructive border-destructive/20",
    InStock: "bg-success-soft text-success border-success/20",
    LowStock: "bg-warning-soft text-warning border-warning/20",
    OutOfStock: "bg-gray-100 text-gray-500 border-gray-200",
    New: "bg-info-soft text-info border-info/20",
    Done: "bg-success-soft text-success border-success/20",
  };
  return map[status] || "bg-gray-100 text-gray-500 border-gray-200";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    NotContacted: "Not Contacted",
    Contacted: "Contacted",
    Unpaid: "Unpaid",
    DepositPaid: "Deposit Paid",
    PaidInFull: "Paid in Full",
    Pending: "Pending",
    ReadyForCollection: "Ready for Collection",
    Completed: "Completed",
    Cancelled: "Cancelled",
    OutOfStock: "Out of Stock",
    InStock: "In Stock",
    LowStock: "Low Stock",
  };
  return map[status] || status;
}
