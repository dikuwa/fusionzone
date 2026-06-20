import { describe, it, expect } from "vitest";
import {
  formatWhatsAppPhone,
  buildWhatsAppUrl,
  WHATSAPP_MESSAGES,
} from "./whatsapp-url";

describe("formatWhatsAppPhone", () => {
  it("strips spaces and keeps digits from Namibia format", () => {
    expect(formatWhatsAppPhone("081 000 0000")).toBe("264810000000");
  });

  it("strips plus sign from international format", () => {
    expect(formatWhatsAppPhone("+264 81 000 0000")).toBe("264810000000");
  });

  it("strips brackets and dashes", () => {
    expect(formatWhatsAppPhone("+264 (81) 000-0000")).toBe("264810000000");
  });

  it("handles already-clean number with 264 prefix", () => {
    expect(formatWhatsAppPhone("264810000000")).toBe("264810000000");
  });

  it("replaces leading 0 with 264", () => {
    expect(formatWhatsAppPhone("0810000000")).toBe("264810000000");
  });

  it("preserves number that starts with 264", () => {
    expect(formatWhatsAppPhone("264811234567")).toBe("264811234567");
  });

  it("returns digits-only for unknown international format", () => {
    expect(formatWhatsAppPhone("+1 555-123-4567")).toBe("15551234567");
  });

  it("handles empty string", () => {
    expect(formatWhatsAppPhone("")).toBe("");
  });

  it("handles number with only spaces and dashes", () => {
    expect(formatWhatsAppPhone("---   ---")).toBe("");
  });
});

describe("buildWhatsAppUrl", () => {
  it("generates wa.me URL without message", () => {
    const url = buildWhatsAppUrl("081 000 0000");
    expect(url).toBe("https://wa.me/264810000000");
  });

  it("generates wa.me URL with message", () => {
    const url = buildWhatsAppUrl("081 000 0000", "Hello");
    expect(url).toBe("https://wa.me/264810000000?text=Hello");
  });

  it("encodes message with special characters", () => {
    const url = buildWhatsAppUrl("264810000000", "Hi, I'm interested!");
    expect(url).toContain("https://wa.me/264810000000?text=");
    expect(url).toContain(encodeURIComponent("Hi, I'm interested!"));
  });

  it("handles long messages with newlines", () => {
    const msg = "Line 1\nLine 2\nLine 3";
    const url = buildWhatsAppUrl("264810000000", msg);
    expect(url).toContain(encodeURIComponent(msg));
  });
});

describe("WHATSAPP_MESSAGES", () => {
  it("provides a general message", () => {
    expect(WHATSAPP_MESSAGES.general).toBe(
      "Hi, I need help with an order/product.",
    );
  });

  it("generates product message with name", () => {
    const msg = WHATSAPP_MESSAGES.product("iPad Pro 13");
    expect(msg).toBe(
      "Hi, I'm interested in this product: iPad Pro 13.",
    );
  });

  it("generates promotion message with title", () => {
    const msg = WHATSAPP_MESSAGES.promotion("Summer Sale");
    expect(msg).toBe(
      "Hi, I'm interested in this promotion: Summer Sale.",
    );
  });

  it("generates receipt message with order number and link", () => {
    const msg = WHATSAPP_MESSAGES.receipt("DT-ABC123", "https://example.com/doc");
    expect(msg).toBe(
      "Please see this document for order DT-ABC123: https://example.com/doc",
    );
  });

  it("generates follow-up message", () => {
    const msg = WHATSAPP_MESSAGES.followUp("John", "DT-ABC123");
    expect(msg).toBe(
      "Hi John, following up on your order DT-ABC123.",
    );
  });

  it("generates enquiry message with single item", () => {
    const msg = WHATSAPP_MESSAGES.enquiry(["iPad Pro 13"]);
    expect(msg).toBe(
      "Hi, I'm interested in these products: iPad Pro 13.",
    );
  });

  it("generates enquiry message with multiple items", () => {
    const msg = WHATSAPP_MESSAGES.enquiry(["iPad Pro 13", "iPhone 16"]);
    expect(msg).toBe(
      "Hi, I'm interested in these products: iPad Pro 13, iPhone 16.",
    );
  });
});
