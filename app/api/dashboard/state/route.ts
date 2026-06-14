import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizePermission } from "@/lib/auth-server";
import { Permissions } from "@/lib/permissions";

const STATE_ID = "dashboard-state-v1";

type DashboardStatePayload = {
  orders?: unknown[];
  customers?: unknown[];
  followUps?: unknown[];
  quotations?: unknown[];
  payments?: unknown[];
  navOrder?: string[];
};

function parseStoredState(data?: string | null): DashboardStatePayload {
  if (!data) return {};
  try {
    return JSON.parse(data) as DashboardStatePayload;
  } catch {
    return {};
  }
}

function mergeByKey<T>(database: T[], stored: T[], getKey: (item: T) => string) {
  const merged = new Map(database.map((item) => [getKey(item), item]));
  for (const item of stored) merged.set(getKey(item), item);
  return Array.from(merged.values());
}

export async function GET() {
  const auth = await authorizePermission(Permissions.DASHBOARD_VIEW);
  if (auth.error) return auth.error;
  if (!db) return NextResponse.json({ state: {} }, { status: 503 });

  const [record, databaseOrders, databaseCustomers] = await Promise.all([
    db.storeSetting.findUnique({ where: { id: STATE_ID } }),
    db.order.findMany({
      include: { customer: true, items: true, payments: true },
      orderBy: { createdAt: "desc" },
    }),
    db.customer.findMany({
      include: { orders: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const stored = parseStoredState(record?.data);
  const orders = databaseOrders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.fullName,
    customerPhone: order.customer.phone,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: order.subtotalCents,
    contactStatus: order.contactStatus,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    preferredContact: order.preferredContact.split(",").filter(Boolean),
    notes: order.notes ?? undefined,
    items: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }));
  const payments = databaseOrders.flatMap((order) =>
    order.payments.map((payment) => ({
      id: payment.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.fullName,
      amountCents: payment.amountCents,
      method: payment.method,
      status: payment.status,
      note: payment.note ?? undefined,
      recordedAt: payment.recordedAt.toISOString(),
    })),
  );
  const customers = databaseCustomers.map((customer) => ({
    id: customer.id,
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email ?? undefined,
    whatsapp: customer.whatsapp ?? undefined,
    preferredContact: customer.preferredContact.split(",").filter(Boolean),
    orderCount: customer.orders.length,
    totalSpentCents: customer.orders.reduce((sum, order) => sum + order.subtotalCents, 0),
    lastOrderDate: customer.orders
      .map((order) => order.createdAt)
      .sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString(),
    createdAt: customer.createdAt.toISOString(),
  }));

  return NextResponse.json({
    state: {
      ...stored,
      orders: mergeByKey(orders, (stored.orders ?? []) as typeof orders, (order) => order.orderNumber),
      payments: mergeByKey(payments, (stored.payments ?? []) as typeof payments, (payment) => payment.id),
      customers: mergeByKey(customers, (stored.customers ?? []) as typeof customers, (customer) => customer.id),
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const auth = await authorizePermission(Permissions.DASHBOARD_VIEW);
  if (auth.error) return auth.error;
  if (!db) return NextResponse.json({ error: "Database is not available." }, { status: 503 });

  const state = await request.json() as DashboardStatePayload;
  const normalized = {
    orders: Array.isArray(state.orders) ? state.orders : [],
    customers: Array.isArray(state.customers) ? state.customers : [],
    followUps: Array.isArray(state.followUps) ? state.followUps : [],
    quotations: Array.isArray(state.quotations) ? state.quotations : [],
    payments: Array.isArray(state.payments) ? state.payments : [],
    navOrder: Array.isArray(state.navOrder) ? state.navOrder : [],
  };
  await db.storeSetting.upsert({
    where: { id: STATE_ID },
    create: { id: STATE_ID, data: JSON.stringify(normalized) },
    update: { data: JSON.stringify(normalized) },
  });
  return NextResponse.json({ success: true });
}
