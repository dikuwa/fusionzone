import { describe, it, expect, beforeEach } from "vitest";
import { useDashboardStore } from "@/lib/store/dashboard";

function resetStore() {
  useDashboardStore.setState({
    auditLogs: [],
    currentUser: "Test Admin",
  });
}

describe("Audit Log - addAuditLog", () => {
  beforeEach(() => {
    resetStore();
  });

  it("should add an audit entry with generated id, timestamp, and performedBy", () => {
    const store = useDashboardStore.getState();
    store.addAuditLog({
      action: "Product created",
      entityType: "product",
      entityId: "p1",
      entityLabel: "MacBook Air",
    });

    const logs = useDashboardStore.getState().auditLogs;
    expect(logs).toHaveLength(1);

    const entry = logs[0];
    expect(entry.action).toBe("Product created");
    expect(entry.entityType).toBe("product");
    expect(entry.entityId).toBe("p1");
    expect(entry.entityLabel).toBe("MacBook Air");
    expect(entry.performedBy).toBe("Test Admin");
    expect(entry.id).toMatch(/^audit-/);
    expect(entry.timestamp).toBeTruthy();
    expect(() => new Date(entry.timestamp)).not.toThrow();
  });

  it("should prepend new entries to the top of the list", () => {
    const store = useDashboardStore.getState();

    store.addAuditLog({ action: "First", entityType: "order", entityId: "o1", entityLabel: "DT-001" });
    store.addAuditLog({ action: "Second", entityType: "order", entityId: "o2", entityLabel: "DT-002" });

    const logs = useDashboardStore.getState().auditLogs;
    expect(logs).toHaveLength(2);
    expect(logs[0].action).toBe("Second");
    expect(logs[1].action).toBe("First");
  });

  it("should store details when provided", () => {
    const store = useDashboardStore.getState();
    store.addAuditLog({
      action: "Settings updated: phone, email",
      entityType: "settings",
      entityId: "store-settings",
      entityLabel: "Store Settings",
      details: "Changed phone and email fields",
    });

    const entry = useDashboardStore.getState().auditLogs[0];
    expect(entry.details).toBe("Changed phone and email fields");
  });
});

describe("Audit Log - product operations", () => {
  beforeEach(() => {
    resetStore();
  });

  it("should log product creation", () => {
    const store = useDashboardStore.getState();
    store.addProduct({
      name: "Test Product",
      brand: "Test Brand",
      category: "Accessories",
      priceCents: 10000,
      stockQuantity: 5,
      lowStockThreshold: 2,
      availability: "InStock",
      condition: "New",
      imageUrl: "/test.jpg",
      description: "A test product",
      sku: "DT-TST-0001",
      isPublished: true,
      isFeatured: false,
    });

    const logs = useDashboardStore.getState().auditLogs;
    const productLog = logs.find((l) => l.action === "Product created");
    expect(productLog).toBeTruthy();
    expect(productLog!.entityLabel).toBe("Test Product");
    expect(productLog!.entityType).toBe("product");
  });

  it("should log product deletion", () => {
    const store = useDashboardStore.getState();
    const products = useDashboardStore.getState().products;
    const firstProduct = products[0];

    store.deleteProduct(firstProduct.id);

    const logs = useDashboardStore.getState().auditLogs;
    const deleteLog = logs.find((l) => l.action === "Product deleted");
    expect(deleteLog).toBeTruthy();
    expect(deleteLog!.entityId).toBe(firstProduct.id);
    expect(deleteLog!.entityLabel).toBe(firstProduct.name);
  });
});

describe("Audit Log - order operations", () => {
  beforeEach(() => {
    resetStore();
  });

  it("should log order creation", () => {
    const store = useDashboardStore.getState();
    store.addOrder({
      customerName: "John Doe",
      customerPhone: "+264 81 123 4567",
      preferredContact: ["WhatsApp"],
      itemCount: 1,
      subtotalCents: 50000,
    });

    const logs = useDashboardStore.getState().auditLogs;
    const orderLog = logs.find((l) => l.action === "Order created");
    expect(orderLog).toBeTruthy();
    expect(orderLog!.entityType).toBe("order");
    expect(orderLog!.entityLabel).toMatch(/^FZ-/);
  });

  it("should log order contact status update", () => {
    const store = useDashboardStore.getState();
    const orders = useDashboardStore.getState().orders;
    const firstOrder = orders[0];

    store.updateOrderContactStatus(firstOrder.id, "Contacted");

    const logs = useDashboardStore.getState().auditLogs;
    const contactLog = logs.find((l) => l.action === "Customer contacted");
    expect(contactLog).toBeTruthy();
    expect(contactLog!.entityId).toBe(firstOrder.id);
  });

  it("should log order payment status update", () => {
    const store = useDashboardStore.getState();
    const orders = useDashboardStore.getState().orders;
    const firstOrder = orders[0];

    store.updateOrderPaymentStatus(firstOrder.id, "PaidInFull");

    const logs = useDashboardStore.getState().auditLogs;
    const paymentLog = logs.find((l) => l.action === "Paid in full");
    expect(paymentLog).toBeTruthy();
    expect(paymentLog!.entityId).toBe(firstOrder.id);
  });
});

describe("Audit Log - quotation operations", () => {
  beforeEach(() => {
    resetStore();
  });

  it("should log quotation creation", () => {
    const store = useDashboardStore.getState();
    store.addQuotation({
      customerName: "Jane Doe",
      customerPhone: "+264 81 987 6543",
      preferredContact: ["Email"],
      items: [{ name: "Item 1", quantity: 1, unitPriceCents: 10000 }],
      subtotalCents: 10000,
    });

    const logs = useDashboardStore.getState().auditLogs;
    const creationLog = logs.find((l) => l.action === "Quotation created");
    expect(creationLog).toBeTruthy();
    expect(creationLog!.entityType).toBe("quotation");
    expect(creationLog!.entityLabel).toMatch(/^FZ-QTN-/);
  });

  it("should log quotation status updates", () => {
    const store = useDashboardStore.getState();
    const quotations = useDashboardStore.getState().quotations;
    const firstQuotation = quotations[0];

    store.updateQuotationStatus(firstQuotation.id, "Sent");

    const logs = useDashboardStore.getState().auditLogs;
    const statusLog = logs.find((l) => l.action === "Quotation status: Sent");
    expect(statusLog).toBeTruthy();
    expect(statusLog!.entityId).toBe(firstQuotation.id);
  });

  it("should log quotation deletion", () => {
    const store = useDashboardStore.getState();
    const quotations = useDashboardStore.getState().quotations;
    const firstQuotation = quotations[0];

    store.deleteQuotation(firstQuotation.id);

    const logs = useDashboardStore.getState().auditLogs;
    const deleteLog = logs.find((l) => l.action === "Quotation deleted");
    expect(deleteLog).toBeTruthy();
    expect(deleteLog!.entityId).toBe(firstQuotation.id);
  });
});

describe("Audit Log - customer operations", () => {
  beforeEach(() => {
    resetStore();
  });

  it("should log customer creation", () => {
    const store = useDashboardStore.getState();
    store.addCustomer({
      fullName: "Alice Smith",
      email: "alice@example.com",
      phone: "+264 81 111 2222",
    });

    const logs = useDashboardStore.getState().auditLogs;
    const creationLog = logs.find((l) => l.action === "Customer created");
    expect(creationLog).toBeTruthy();
    expect(creationLog!.entityLabel).toBe("Alice Smith");
  });

  it("should log customer updates", () => {
    const store = useDashboardStore.getState();
    const customers = useDashboardStore.getState().customers;
    const firstCustomer = customers[0];

    store.updateCustomer(firstCustomer.id, { phone: "+264 81 333 4444" });

    const logs = useDashboardStore.getState().auditLogs;
    const updateLog = logs.find((l) => l.action === "Customer updated");
    expect(updateLog).toBeTruthy();
    expect(updateLog!.entityId).toBe(firstCustomer.id);
  });
});

describe("Audit Log - payment operations", () => {
  beforeEach(() => {
    resetStore();
  });

  it("should log payment recording", () => {
    const store = useDashboardStore.getState();
    store.addPayment({
      orderNumber: "DT-TEST",
      customerName: "Bob",
      amountCents: 50000,
      method: "Bank Transfer",
      status: "Confirmed",
    });

    const logs = useDashboardStore.getState().auditLogs;
    const paymentLog = logs.find((l) => l.action.startsWith("Payment recorded:"));
    expect(paymentLog).toBeTruthy();
    expect(paymentLog!.entityType).toBe("payment");
    expect(paymentLog!.entityLabel).toContain("DT-TEST");
  });
});

describe("Audit Log - back-in-stock operations", () => {
  beforeEach(() => {
    resetStore();
  });

  it("should log back-in-stock request creation", () => {
    const store = useDashboardStore.getState();
    store.addBackInStockRequest({
      productId: "p1",
      productName: "Test Product",
      customerName: "Charlie",
      contactValue: "+264 81 555 6666",
      preferredContact: ["WhatsApp"],
      urgency: "ASAP",
    });

    const logs = useDashboardStore.getState().auditLogs;
    const creationLog = logs.find((l) => l.action === "Back-in-stock request created");
    expect(creationLog).toBeTruthy();
    expect(creationLog!.entityType).toBe("backinstock");
    expect(creationLog!.entityLabel).toContain("Charlie");
  });

  it("should log back-in-stock status updates", () => {
    const store = useDashboardStore.getState();
    const requests = useDashboardStore.getState().backInStockRequests;
    const firstRequest = requests[0];

    store.updateBackInStockStatus(firstRequest.id, "Contacted");

    const logs = useDashboardStore.getState().auditLogs;
    const statusLog = logs.find((l) => l.action === "Back-in-stock status: Contacted");
    expect(statusLog).toBeTruthy();
    expect(statusLog!.entityId).toBe(firstRequest.id);
  });

  it("should log back-in-stock deletion", () => {
    const store = useDashboardStore.getState();
    const requests = useDashboardStore.getState().backInStockRequests;
    const firstRequest = requests[0];

    store.deleteBackInStockRequest(firstRequest.id);

    const logs = useDashboardStore.getState().auditLogs;
    const deleteLog = logs.find((l) => l.action === "Back-in-stock request deleted");
    expect(deleteLog).toBeTruthy();
    expect(deleteLog!.entityId).toBe(firstRequest.id);
  });
});

describe("Audit Log - settings operations", () => {
  beforeEach(() => {
    resetStore();
  });

  it("should log settings updates", () => {
    const store = useDashboardStore.getState();
    store.updateSettings({ storeName: "New Name", email: "new@example.com" });

    const logs = useDashboardStore.getState().auditLogs;
    const settingsLog = logs.find((l) => l.action.startsWith("Settings updated:"));
    expect(settingsLog).toBeTruthy();
    expect(settingsLog!.action).toContain("storeName");
    expect(settingsLog!.action).toContain("email");
    expect(settingsLog!.entityType).toBe("settings");
  });
});
