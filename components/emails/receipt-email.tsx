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
  Row,
  Column,
} from "@react-email/components";

interface ReceiptEmailProps {
  customerName: string;
  orderNumber: string;
  receiptNumber: string;
  totalAmount: string;
  publicUrl?: string;
  storeName?: string;
  storePhone?: string;
  storeEmail?: string;
}

import { getAppUrl } from "@/lib/app-url";
const baseUrl = getAppUrl();

export function ReceiptEmail({
  customerName,
  orderNumber,
  receiptNumber,
  totalAmount,
  publicUrl,
  storeName = "FusionZone",
  storePhone = "+264 00 000 0000",
  storeEmail = "sales@fusionzone.example",
}: ReceiptEmailProps) {
  const receiptUrl = publicUrl || `${baseUrl}/api/receipts/generate?orderId=${orderNumber}&view=1`;

  return (
    <Html>
      <Head />
      <Preview>Your receipt for {orderNumber} — {storeName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Img
                src={`${baseUrl}/images/fusionzone-logo-blue.png`}
                alt={storeName}
                width="40"
                height="40"
                style={{ display: "block" }}
              />
              <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>{storeName}</span>
            </div>
            <Text style={tagline}>Namibia&rsquo;s trusted tech supplier</Text>
          </Section>

          <Heading style={h1}>Receipt Issued</Heading>

          <Text style={paragraph}>Hi {customerName},</Text>
          <Text style={paragraph}>
            Thank you for your purchase. Your receipt has been issued for order{" "}
            <strong>{orderNumber}</strong>.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailsTitle}>Receipt Summary</Text>
            <Row style={detailRow}>
              <Column style={detailLabel}>Receipt #</Column>
              <Column style={detailValue}>{receiptNumber}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Order #</Column>
              <Column style={detailValue}>{orderNumber}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Total</Column>
              <Column style={detailValue}>{totalAmount}</Column>
            </Row>
          </Section>

          <Section style={ctaSection}>
            <Link href={receiptUrl} style={button}>
              View Receipt
            </Link>
          </Section>

          <Text style={paragraph}>
            You can also download the PDF using the link above. If you have any
            questions, feel free to reply to this email or contact us on
            WhatsApp.
          </Text>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              {storeName}
              <br />
              {storePhone}
              <br />
              {storeEmail}
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

const detailsBox = {
  backgroundColor: "#f9fafb",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  margin: "24px 0",
  padding: "16px",
};

const detailsTitle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#1a1a2e",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
  letterSpacing: 1,
};

const detailRow = {
  marginBottom: 6,
};

const detailLabel = {
  color: "#6b7280",
  fontSize: 13,
  width: "40%",
};

const detailValue = {
  color: "#1a1a2e",
  fontSize: 13,
  fontWeight: 600,
  width: "60%",
};

const ctaSection = {
  margin: "24px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#0d41e2",
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
