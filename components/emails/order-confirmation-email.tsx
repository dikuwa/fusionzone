import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  storeName?: string;
  storePhone?: string;
}

import { getAppUrl } from "@/lib/app-url";
const baseUrl = getAppUrl();

export function OrderConfirmationEmail({
  customerName,
  orderNumber,
  storeName = "FusionZone",
  storePhone = "+264 00 000 0000",
}: OrderConfirmationEmailProps) {
  const orderUrl = `${baseUrl}/order-success/${orderNumber}`;

  return (
    <Html>
      <Head />
      <Preview>Order {orderNumber} received — {storeName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Img
                src={`${baseUrl}/images/receipt-icon.svg`}
                alt={storeName}
                width="40"
                height="40"
                style={{ display: "block" }}
              />
              <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>{storeName}</span>
            </div>
            <Text style={tagline}>Thank you for your order</Text>
          </Section>

          <Heading style={h1}>Order Received!</Heading>

          <Text style={paragraph}>Hi {customerName},</Text>
          <Text style={paragraph}>
            We&rsquo;ve received your order <strong>{orderNumber}</strong> and
            will contact you shortly via your preferred method to confirm the
            details and arrange collection or delivery.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightTitle}>What happens next?</Text>
            <Text style={highlightText}>
              1. We&rsquo;ll review your order within 24 hours
              {"\n"}
              2. You&rsquo;ll receive a WhatsApp or phone call to confirm
              {"\n"}
              3. We&rsquo;ll arrange payment and collection
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Link href={`https://wa.me/264000000000?text=${encodeURIComponent("Hi, I have a question about my order.")}`} style={button}>
              Contact us on WhatsApp
            </Link>
          </Section>

          <Text style={paragraph}>
            If you need to make any changes to your order, please contact us as
            soon as possible.
          </Text>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              {storeName}
              <br />
              {storePhone}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: "20px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "520px",
  padding: "40px 32px",
};

const header = {
  marginBottom: 24,
  textAlign: "center" as const,
};

const logo = {
  display: "block",
  height: "54px",
  margin: "0 auto",
  objectFit: "contain" as const,
  width: "180px",
};

const tagline = {
  fontSize: 12,
  color: "#0d41e2",
  margin: "4px 0 0 0",
  fontWeight: 600,
};

const h1 = {
  color: "#1a1a2e",
  fontSize: 24,
  fontWeight: 700,
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#4b5563",
  fontSize: 14,
  lineHeight: "22px",
  margin: "0 0 16px",
};

const highlightBox = {
  backgroundColor: "#fef3c7",
  borderRadius: 8,
  border: "1px solid #fde68a",
  margin: "24px 0",
  padding: "16px",
};

const highlightTitle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#92400e",
  margin: "0 0 8px",
};

const highlightText = {
  color: "#92400e",
  fontSize: 13,
  lineHeight: "22px",
  margin: 0,
  whiteSpace: "pre-line" as const,
};

const ctaSection = {
  margin: "24px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#25D366",
  borderRadius: 8,
  color: "#ffffff",
  display: "inline-block",
  fontSize: 14,
  fontWeight: 600,
  padding: "12px 28px",
  textDecoration: "none",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0 16px",
};

const footer = {
  textAlign: "center" as const,
};

const footerText = {
  color: "#6b7280",
  fontSize: 11,
  lineHeight: "18px",
  margin: 0,
};
