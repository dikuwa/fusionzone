import { parseHumanToCents } from "./format";

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

export const mockOrders: DashboardOrder[] = [
  { id: "o1", orderNumber: "DT-A1B2C3", customerName: "John Mwale", customerPhone: "+264 81 123 4567", itemCount: 2, subtotalCents: parseHumanToCents("24999"), contactStatus: "NotContacted", paymentStatus: "Unpaid", fulfillmentStatus: "Pending",  preferredContact: ["WhatsApp"], createdAt: "2026-06-01T10:30:00Z", updatedAt: "2026-06-01T10:30:00Z" },
  { id: "o2", orderNumber: "DT-D4E5F6", customerName: "Maria Shikongo", customerPhone: "+264 85 234 5678", itemCount: 1, subtotalCents: parseHumanToCents("18599"), contactStatus: "Contacted", paymentStatus: "Unpaid", fulfillmentStatus: "Pending", preferredContact: ["Phone"], createdAt: "2026-05-30T14:15:00Z", updatedAt: "2026-05-31T09:00:00Z", items: [{ name: "Samsung Galaxy S25 Ultra", sku: "DT-PHT-0001", quantity: 1, unitPriceCents: parseHumanToCents("18599") }] },
  { id: "o3", orderNumber: "DT-G7H8I9", customerName: "Petrus Nangolo", customerPhone: "+264 81 345 6789", itemCount: 3, subtotalCents: parseHumanToCents("32499"), contactStatus: "Contacted", paymentStatus: "DepositPaid", fulfillmentStatus: "Pending", preferredContact: ["WhatsApp", "Phone"], createdAt: "2026-05-28T08:45:00Z", updatedAt: "2026-05-29T11:30:00Z" },
  { id: "o4", orderNumber: "DT-J0K1L2", customerName: "Selma Amadhila", customerPhone: "+264 85 456 7890", itemCount: 1, subtotalCents: parseHumanToCents("5999"), contactStatus: "Contacted", paymentStatus: "PaidInFull", fulfillmentStatus: "Completed", preferredContact: ["Email"], createdAt: "2026-05-25T16:20:00Z", updatedAt: "2026-05-26T10:00:00Z", items: [{ name: "Hikvision 8CH CCTV Kit", sku: "DT-CCTV-0001", quantity: 1, unitPriceCents: parseHumanToCents("5999") }] },
  { id: "o5", orderNumber: "DT-M3N4O5", customerName: "Tomas Haingura", customerPhone: "+264 81 567 8901", itemCount: 2, subtotalCents: parseHumanToCents("15999"), contactStatus: "Contacted", paymentStatus: "PaidInFull", fulfillmentStatus: "ReadyForCollection", preferredContact: ["WhatsApp"], createdAt: "2026-05-22T09:00:00Z", updatedAt: "2026-05-24T14:00:00Z" },
  { id: "o6", orderNumber: "DT-P6Q7R8", customerName: "Lukas Indongo", customerPhone: "+264 85 678 9012", itemCount: 1, subtotalCents: parseHumanToCents("4499"), contactStatus: "Contacted", paymentStatus: "PaidInFull", fulfillmentStatus: "Completed", preferredContact: ["Phone", "WhatsApp"], createdAt: "2026-05-18T11:30:00Z", updatedAt: "2026-05-20T15:00:00Z" },
  { id: "o7", orderNumber: "DT-S9T0U1", customerName: "Grace Kambonde", customerPhone: "+264 81 789 0123", itemCount: 4, subtotalCents: parseHumanToCents("45999"), contactStatus: "NotContacted", paymentStatus: "Unpaid", fulfillmentStatus: "Pending", preferredContact: ["WhatsApp"], createdAt: "2026-06-02T08:00:00Z", updatedAt: "2026-06-02T08:00:00Z" },
  { id: "o8", orderNumber: "DT-V2W3X4", customerName: "David Nghifikwa", customerPhone: "+264 85 890 1234", itemCount: 2, subtotalCents: parseHumanToCents("21999"), contactStatus: "Contacted", paymentStatus: "Unpaid", fulfillmentStatus: "Cancelled", preferredContact: ["WhatsApp"], createdAt: "2026-05-15T13:00:00Z", updatedAt: "2026-05-16T10:00:00Z" },
  { id: "o9", orderNumber: "DT-Y5Z6A7", customerName: "Rachel Shovaleka", customerPhone: "+264 81 901 2345", itemCount: 1, subtotalCents: parseHumanToCents("2899"), contactStatus: "Contacted", paymentStatus: "Unpaid", fulfillmentStatus: "Pending", preferredContact: ["Email"], createdAt: "2026-06-01T15:30:00Z", updatedAt: "2026-06-01T15:30:00Z" },
  { id: "o10", orderNumber: "DT-B8C9D0", customerName: "Erastus Hamutenya", customerPhone: "+264 85 012 3456", itemCount: 1, subtotalCents: parseHumanToCents("12999"), contactStatus: "Contacted", paymentStatus: "DepositPaid", fulfillmentStatus: "Pending", preferredContact: ["Phone", "Email"], createdAt: "2026-05-29T10:00:00Z", updatedAt: "2026-05-30T09:30:00Z", items: [{ name: "Lenovo ThinkPad X1 Carbon", sku: "DT-LAP-0002", quantity: 1, unitPriceCents: parseHumanToCents("12999") }] },
];

export const mockProducts: DashboardProduct[] = [
  { id: "p1", name: 'MacBook Air 15" M3', slug: "macbook-air-15-m3", category: "Apple", brand: "Apple", priceCents: parseHumanToCents("18999"), stockQuantity: 8, lowStockThreshold: 3, availability: "InStock", condition: "New", isPublished: true, isFeatured: true, createdAt: "2026-05-01", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd6ca8?w=200&h=200&fit=crop" },
  { id: "p2", name: "Dell XPS 16", slug: "dell-xps-16", category: "Windows", brand: "Dell", priceCents: parseHumanToCents("25999"), stockQuantity: 2, lowStockThreshold: 3, availability: "LowStock", condition: "New", isPublished: true, isFeatured: true, createdAt: "2026-05-02", imageUrl: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=200&h=200&fit=crop" },
  { id: "p3", name: "Gaming PC Ryzen 7", slug: "gaming-pc-ryzen-7-rtx-4070", category: "Gaming", brand: "Custom Build", priceCents: parseHumanToCents("21999"), stockQuantity: 5, lowStockThreshold: 3, availability: "InStock", condition: "New", isPublished: true, isFeatured: true, createdAt: "2026-05-03", imageUrl: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=200&h=200&fit=crop" },
  { id: "p4", name: "iPad Pro 13″ M4", slug: "ipad-pro-13-m4", category: "Apple", brand: "Apple", priceCents: parseHumanToCents("16499"), stockQuantity: 0, lowStockThreshold: 3, availability: "OutOfStock", condition: "New", isPublished: true, isFeatured: true, createdAt: "2026-05-04", imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&h=200&fit=crop" },
  { id: "p5", name: "Samsung Galaxy S25 Ultra", slug: "samsung-galaxy-s25-ultra", category: "Phones & Tablets", brand: "Samsung", priceCents: parseHumanToCents("18599"), stockQuantity: 12, lowStockThreshold: 3, availability: "InStock", condition: "New", isPublished: true, isFeatured: true, createdAt: "2026-05-05", imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200&h=200&fit=crop" },
  { id: "p6", name: "Hikvision 8CH CCTV Kit", slug: "hikvision-8ch-cctv-kit", category: "CCTV & Security", brand: "Hikvision", priceCents: parseHumanToCents("5999"), stockQuantity: 4, lowStockThreshold: 3, availability: "InStock", condition: "New", isPublished: true, isFeatured: true, createdAt: "2026-05-06", imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=200&h=200&fit=crop" },
  { id: "p7", name: "Lenovo ThinkPad X1", slug: "lenovo-thinkpad-x1-carbon", category: "Windows", brand: "Lenovo", priceCents: parseHumanToCents("12999"), stockQuantity: 1, lowStockThreshold: 3, availability: "LowStock", condition: "Refurbished", isPublished: true, isFeatured: false, createdAt: "2026-05-07", imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&h=200&fit=crop" },
  { id: "p8", name: "Logitech MX Master 3S", slug: "logitech-mx-master-3s", category: "Accessories", brand: "Logitech", priceCents: parseHumanToCents("1599"), stockQuantity: 25, lowStockThreshold: 5, availability: "InStock", condition: "New", isPublished: true, isFeatured: false, createdAt: "2026-05-08", imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop" },
  { id: "p9", name: 'MacBook Pro 14" M4', slug: "macbook-pro-14-m4-pro", category: "Apple", brand: "Apple", priceCents: parseHumanToCents("27999"), stockQuantity: 3, lowStockThreshold: 3, availability: "InStock", condition: "New", isPublished: true, isFeatured: false, createdAt: "2026-05-09", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd6ca8?w=200&h=200&fit=crop" },
  { id: "p10", name: "ASUS ROG Strix G16", slug: "asus-rog-strix-g16", category: "Gaming", brand: "ASUS", priceCents: parseHumanToCents("22499"), stockQuantity: 1, lowStockThreshold: 3, availability: "LowStock", condition: "New", isPublished: true, isFeatured: false, createdAt: "2026-05-10", imageUrl: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=200&h=200&fit=crop" },
];

export const mockCustomers: DashboardCustomer[] = [
  { id: "c1", fullName: "John Mwale", phone: "+264 81 123 4567", email: "john@example.com", whatsapp: "+264 81 123 4567", preferredContact: ["WhatsApp"], orderCount: 3, totalSpentCents: parseHumanToCents("54999"), lastOrderDate: "2026-06-01", createdAt: "2026-04-15" },
  { id: "c2", fullName: "Maria Shikongo", phone: "+264 85 234 5678", email: "maria@example.com", preferredContact: ["Phone"], orderCount: 1, totalSpentCents: parseHumanToCents("18599"), lastOrderDate: "2026-05-30", createdAt: "2026-05-30" },
  { id: "c3", fullName: "Petrus Nangolo", phone: "+264 81 345 6789", whatsapp: "+264 81 345 6789", preferredContact: ["WhatsApp", "Phone"], orderCount: 2, totalSpentCents: parseHumanToCents("44999"), lastOrderDate: "2026-05-28", createdAt: "2026-04-20" },
  { id: "c4", fullName: "Selma Amadhila", phone: "+264 85 456 7890", email: "selma@example.com", preferredContact: ["Email"], orderCount: 1, totalSpentCents: parseHumanToCents("5999"), lastOrderDate: "2026-05-25", createdAt: "2026-05-25" },
  { id: "c5", fullName: "Tomas Haingura", phone: "+264 81 567 8901", whatsapp: "+264 81 567 8901", preferredContact: ["WhatsApp", "Email"], orderCount: 4, totalSpentCents: parseHumanToCents("69999"), lastOrderDate: "2026-05-22", createdAt: "2026-03-10" },
  { id: "c6", fullName: "Grace Kambonde", phone: "+264 81 789 0123", whatsapp: "+264 81 789 0123", email: "grace@example.com", preferredContact: ["WhatsApp"], orderCount: 1, totalSpentCents: parseHumanToCents("45999"), lastOrderDate: "2026-06-02", createdAt: "2026-06-02" },
];

export const mockPromotions: DashboardPromotion[] = [
  { id: "pr1", title: "Gaming Setup Bundle", slug: "gaming-bundle", description: "Complete gaming rig bundle", imageUrl: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=900&h=500&fit=crop", discountLabel: "Save up to N$ 2,000", placement: "HomeHero", isActive: true, sortOrder: 0, startsAt: "2026-05-01", endsAt: "2026-06-30", productCount: 5 },
  { id: "pr2", title: "Back to School Special", slug: "back-to-school", description: "Student discounts on laptops", imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900&h=500&fit=crop", discountLabel: "Up to 15% off", placement: "FeaturedSection", isActive: true, sortOrder: 1, startsAt: "2026-05-15", endsAt: "2026-07-15", productCount: 8 },
  { id: "pr3", title: "CCTV Bundle Deals", slug: "cctv-bundle", description: "Security camera bundles", imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=900&h=500&fit=crop", discountLabel: "Save up to N$ 1,500", placement: "FeaturedSection", isActive: false, sortOrder: 2, startsAt: "2026-04-01", endsAt: "2026-05-31", productCount: 3 },
];

export const mockStaff: DashboardStaff[] = [
  { id: "s1", name: "Admin User", email: "admin@deserttech.com", role: "Admin", permissions: ["all"], lastActive: "2026-06-02T10:00:00Z", isActive: true, createdAt: "2026-01-01" },
  { id: "s2", name: "Sarah Staff", email: "sarah@deserttech.com", role: "Staff", permissions: ["orders:view", "orders:update", "products:view", "customers:view", "followups:manage"], lastActive: "2026-06-01T14:30:00Z", isActive: true, createdAt: "2026-02-15" },
  { id: "s3", name: "Mike Assistant", email: "mike@deserttech.com", role: "Staff", permissions: ["orders:view", "customers:view"], lastActive: "2026-05-28T09:00:00Z", isActive: true, createdAt: "2026-03-01" },
];

export const mockFollowUps: DashboardFollowUp[] = [
  { id: "f1", orderNumber: "DT-A1B2C3", customerName: "John Mwale", type: "WhatsApp", status: "Pending", note: "Follow up on order availability", assignedTo: "Sarah Staff", dueAt: "2026-06-03T10:00:00Z", createdAt: "2026-06-01T10:30:00Z" },
  { id: "f2", orderNumber: "DT-D4E5F6", customerName: "Maria Shikongo", type: "Phone", status: "Done", note: "Called customer, waiting for payment", assignedTo: "Admin User", dueAt: "2026-06-01T14:00:00Z", createdAt: "2026-05-30T14:15:00Z" },
  { id: "f3", orderNumber: "DT-Y5Z6A7", customerName: "Rachel Shovaleka", type: "Email", status: "Pending", note: "Send payment link and bank details", assignedTo: "Sarah Staff", dueAt: "2026-06-04T09:00:00Z", createdAt: "2026-06-01T15:30:00Z" },
  { id: "f4", orderNumber: "DT-B8C9D0", customerName: "Erastus Hamutenya", type: "Phone", status: "Pending", note: "Confirm deposit received", assignedTo: "Admin User", dueAt: "2026-06-02T11:00:00Z", createdAt: "2026-05-29T10:00:00Z" },
  { id: "f5", orderNumber: "DT-S9T0U1", customerName: "Grace Kambonde", type: "WhatsApp", status: "Pending", note: "New order - contact customer", assignedTo: "Sarah Staff", dueAt: "2026-06-03T08:00:00Z", createdAt: "2026-06-02T08:00:00Z" },
];

export const mockNotifications: DashboardNotification[] = [
  { id: "n1", type: "order", title: "New Order", message: "Grace Kambonde placed a new order (DT-S9T0U1)", isRead: false, createdAt: "2026-06-02T08:00:00Z" },
  { id: "n2", type: "payment", title: "Payment Received", message: "Selma Amadhila completed payment for DT-J0K1L2", isRead: false, createdAt: "2026-05-26T10:00:00Z" },
  { id: "n3", type: "stock", title: "Low Stock Alert", message: "Dell XPS 16 is low on stock (2 remaining)", isRead: true, createdAt: "2026-05-25T09:00:00Z" },
  { id: "n4", type: "followup", title: "Follow-up Due", message: "Follow-up with John Mwale is due today", isRead: true, createdAt: "2026-06-02T06:00:00Z" },
  { id: "n5", type: "order", title: "Order Completed", message: "Order DT-P6Q7R8 has been marked as completed", isRead: true, createdAt: "2026-05-20T15:00:00Z" },
  { id: "n6", type: "contact", title: "New Enquiry", message: "New contact form submission from Helena Ndapanda", isRead: false, createdAt: "2026-06-01T18:30:00Z" },
];

export const mockBackInStockRequests: DashboardBackInStockRequest[] = [
  {
    id: "b1",
    productId: "p4",
    productName: 'iPad Pro 13" M4',
    customerName: "Helena Ndapanda",
    preferredContact: ["WhatsApp"],
    contactValue: "264811234567",
    urgency: "ASAP",
    note: "Need for school, starting next week",
    status: "New",
    createdAt: "2026-06-02T09:00:00Z",
    updatedAt: "2026-06-02T09:00:00Z",
  },
  {
    id: "b2",
    productId: "p4",
    productName: 'iPad Pro 13" M4',
    customerName: "Tomas Shikongo",
    preferredContact: ["Email"],
    contactValue: "tomas@example.com",
    urgency: "Flexible",
    note: "Would like to know when back in stock",
    status: "New",
    createdAt: "2026-06-01T14:30:00Z",
    updatedAt: "2026-06-01T14:30:00Z",
  },
  {
    id: "b3",
    productId: "p13",
    productName: "iPhone 16 Pro Max",
    customerName: "Maria Kambonde",
    preferredContact: ["Phone"],
    contactValue: "264852345678",
    urgency: "JustChecking",
    status: "ReadyToContact",
    createdAt: "2026-05-28T11:00:00Z",
    updatedAt: "2026-06-02T08:00:00Z",
  },
  {
    id: "b4",
    productId: "p13",
    productName: "iPhone 16 Pro Max",
    customerName: "Petrus Nangolo",
    preferredContact: ["WhatsApp"],
    contactValue: "264813456789",
    urgency: "ASAP",
    note: "Upgrading from iPhone 13",
    status: "Contacted",
    createdAt: "2026-05-25T16:00:00Z",
    updatedAt: "2026-05-30T10:00:00Z",
  },
  {
    id: "b5",
    productId: "p13",
    productName: "iPhone 16 Pro Max",
    customerName: "Selma Amadhila",
    preferredContact: ["WhatsApp"],
    contactValue: "264854567890",
    urgency: "Flexible",
    status: "Cancelled",
    createdAt: "2026-05-20T08:00:00Z",
    updatedAt: "2026-05-22T12:00:00Z",
  },
];

export const mockQuotations: DashboardQuotation[] = [
  { id: "qtn1", quotationNumber: "QTN-A1B2C3", customerName: "John Mwale", customerPhone: "+264 81 123 4567", preferredContact: ["WhatsApp"], items: [{ name: 'MacBook Air 15" M3', sku: "DT-APP-0001", quantity: 1, unitPriceCents: parseHumanToCents("18999") }, { name: "Logitech MX Master 3S", sku: "DT-ACC-0001", quantity: 1, unitPriceCents: parseHumanToCents("1599") }], subtotalCents: parseHumanToCents("20598"), notes: "Valid for 14 days. Delivery within 3 business days.", status: "Draft", createdAt: "2026-06-03T09:00:00Z", updatedAt: "2026-06-03T09:00:00Z" },
  { id: "qtn2", quotationNumber: "QTN-D4E5F6", customerName: "Maria Shikongo", customerPhone: "+264 85 234 5678", preferredContact: ["Phone"], items: [{ name: "Dell XPS 16", sku: "DT-LAP-0001", quantity: 1, unitPriceCents: parseHumanToCents("25999") }], subtotalCents: parseHumanToCents("25999"), notes: "Price includes setup and data migration. Payment via bank transfer.", status: "Sent", createdAt: "2026-06-02T14:00:00Z", updatedAt: "2026-06-03T10:00:00Z" },
  { id: "qtn3", quotationNumber: "QTN-G7H8I9", customerName: "Petrus Nangolo", customerPhone: "+264 81 345 6789", preferredContact: ["WhatsApp", "Email"], items: [{ name: "Gaming PC Ryzen 7", sku: "DT-GAME-0001", quantity: 1, unitPriceCents: parseHumanToCents("21999") }], subtotalCents: parseHumanToCents("21999"), status: "Accepted", createdAt: "2026-06-01T11:00:00Z", updatedAt: "2026-06-02T09:30:00Z" },
];

export const mockPayments: DashboardPayment[] = [
  { id: "pay1", orderNumber: "DT-G7H8I9", customerName: "Petrus Nangolo", amountCents: parseHumanToCents("10000"), method: "BankTransfer", status: "Confirmed", recordedAt: "2026-05-29T11:30:00Z" },
  { id: "pay2", orderNumber: "DT-J0K1L2", customerName: "Selma Amadhila", amountCents: parseHumanToCents("5999"), method: "Cash", status: "Confirmed", recordedAt: "2026-05-26T10:00:00Z" },
  { id: "pay3", orderNumber: "DT-M3N4O5", customerName: "Tomas Haingura", amountCents: parseHumanToCents("15999"), method: "BankTransfer", status: "Confirmed", recordedAt: "2026-05-24T14:00:00Z" },
  { id: "pay4", orderNumber: "DT-P6Q7R8", customerName: "Lukas Indongo", amountCents: parseHumanToCents("4499"), method: "Cash", status: "Confirmed", recordedAt: "2026-05-20T15:00:00Z" },
  { id: "pay5", orderNumber: "DT-B8C9D0", customerName: "Erastus Hamutenya", amountCents: parseHumanToCents("5000"), method: "PhoneTransfer", status: "Pending", recordedAt: "2026-05-30T09:30:00Z" },
];

export const storeSettings = {
  storeName: "Desert Technology Consultant",
  phone: "+264 85 277 5140",
  whatsapp: "264852775140",
  email: "sales@desertechnam.com",
  address: "Windhoek, Namibia",
  bankName: "Standard Bank",
  bankAccountName: "Desert TECHNOLOGIES",
  bankAccountNumber: "60003162833",
  bankBranchCode: "082672",
  receiptPrefix: "DT",
  lowStockThreshold: 5,
  currency: "NAD",
  heroHeading: "Namibia&rsquo;s tech — tested, warranted, and a message away.",
  heroSubheading: "Shop laptops, phones, gaming builds, CCTV, networking and POS gear with clear pricing, tested stock and direct local assistance.",
  heroImageUrl: "/images/DTC-BG.webp",
  contactDetails: [] as ContactDetail[],
  bankDetails: [] as BankDetail[],
  paymentMethods: [] as PaymentMethod[],
};

export const defaultContactDetails: ContactDetail[] = [
  { id: "cd1", type: "phone", label: "Main", value: "+264 85 277 5140", isActive: true },
  { id: "cd2", type: "whatsapp", label: "Sales", value: "264852775140", isActive: true },
  { id: "cd3", type: "email", label: "General", value: "sales@desertechnam.com", isActive: true },
  { id: "cd4", type: "address", label: "Physical", value: "Windhoek, Namibia", isActive: true },
];

export const defaultBankDetails: BankDetail[] = [
  { id: "bd1", bankName: "Standard Bank", accountName: "Desert TECHNOLOGIES", accountNumber: "60003162833", branchCode: "082672", isActive: true },
];

export const defaultPaymentMethods: PaymentMethod[] = [
  { id: "pm1", name: "Bank Transfer", type: "BankTransfer", details: "Standard Bank", instructions: "Use your order reference as payment reference", isActive: true },
  { id: "pm2", name: "Cash at Store", type: "Cash", details: "Pay in person at our Windhoek location", isActive: true },
  { id: "pm3", name: "Phone Transfer (E-Wallet)", type: "PhoneTransfer", details: "Send via mobile money or e-wallet", instructions: "Contact us for the phone number to send to", isActive: true },
];

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
