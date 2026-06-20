import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import path from "node:path";

// Register Space Grotesk — same font as the website and receipt PDF
const fontRegular = path.join(process.cwd(), "public", "fonts", "SpaceGrotesk-Regular.ttf");
const fontBold = path.join(process.cwd(), "public", "fonts", "SpaceGrotesk-Bold.ttf");
Font.register({
  family: "SpaceGrotesk",
  fonts: [
    { src: fontRegular, fontWeight: "normal" },
    { src: fontBold, fontWeight: "bold" },
  ],
});

const colors = {
  primary: "#0d41e2",
  text: "#1a1a2e",
  muted: "#6b7280",
  border: "#ddd8d2",
  page: "#f7f5f2",
  document: "#fffdfb",
  surface: "#f6f4f1",
  successSoft: "#edf7ef",
  warningSoft: "#fff6e8",
  success: "#15803d",
  warning: "#d97706",
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "SpaceGrotesk",
    fontSize: 9,
    color: colors.text,
    backgroundColor: colors.page,
  },
  document: {
    border: `1 solid ${colors.border}`,
    borderRadius: 8,
    backgroundColor: colors.document,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottom: `1 solid ${colors.border}`,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottom: `1 solid ${colors.border}`,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: { flexDirection: "row", alignItems: "flex-start" },
  logo: { width: 48, height: 42, objectFit: "contain", marginRight: 12 },
  companyName: { fontSize: 12.5, fontWeight: "bold", marginBottom: 3 },
  companyLine: { fontSize: 8, color: colors.muted, marginBottom: 1.5 },
  badge: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    color: "#ffffff",
    borderRadius: 4,
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    fontSize: 7.5,
    fontWeight: "bold",
  },
  documentNumber: { marginTop: 8, fontSize: 10.5, fontWeight: "bold", textAlign: "right" },
  infoGrid: { flexDirection: "row" },
  infoColumn: { flex: 1 },
  label: {
    fontSize: 6.75,
    fontWeight: "bold",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: { fontSize: 9, fontWeight: "bold" },
  customerName: { fontSize: 9.5, fontWeight: "bold", marginBottom: 2.5 },
  customerLine: { fontSize: 8, color: colors.muted, marginBottom: 1.5 },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 5,
    borderBottom: `1 solid ${colors.border}`,
  },
  tableRow: { flexDirection: "row", paddingVertical: 6 },
  headerText: {
    fontSize: 6.75,
    fontWeight: "bold",
    color: colors.muted,
    textTransform: "uppercase",
  },
  cell: { fontSize: 8.5 },
  description: { width: "38%" },
  sku: { width: "22%", textAlign: "left" },
  qty: { width: "10%", textAlign: "center" },
  price: { width: "15%", textAlign: "right" },
  total: { width: "15%", textAlign: "right", fontWeight: "bold" },
  totals: { width: 220, marginLeft: "auto" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3.5,
  },
  totalLabel: { fontSize: 8.5, color: colors.muted },
  totalValue: { fontSize: 8.5, fontWeight: "bold" },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `1 solid ${colors.border}`,
    paddingTop: 6,
    marginTop: 3,
  },
  grandText: { fontSize: 11, fontWeight: "bold" },
  footer: { paddingHorizontal: 20, paddingVertical: 9, textAlign: "center" },
  footerText: { fontSize: 6.75, color: colors.muted, marginBottom: 1 },
  notesBox: {
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 4,
    marginTop: 4,
  },
  notesText: { fontSize: 8, color: colors.text, lineHeight: 1.4 },
});

interface QuotationItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sku?: string;
}

export interface QuotationPDFProps {
  quotationNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: QuotationItem[];
  subtotal: number;
  notes?: string;
  status: string;
  storeName?: string;
  storeLocation?: string;
  storePhone?: string;
  storeEmail?: string;
  logoSrc?: string | null;
}

function formatCurrency(cents: number): string {
  return `N$ ${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function statusLabel(status: string): string {
  if (status === "Draft") return "Draft";
  if (status === "Sent") return "Sent to Customer";
  if (status === "Accepted") return "Accepted";
  if (status === "Declined") return "Declined";
  return status;
}

export function QuotationPDF({
  quotationNumber,
  date,
  customerName,
  customerPhone,
  customerEmail,
  items,
  subtotal,
  notes,
  status,
  storeName = "FusionZone",
  storeLocation = "Windhoek, Namibia",
  storePhone = "+264 00 000 0000",
  storeEmail = "sales@fusionzone.example",
  logoSrc,
}: QuotationPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.document}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brand}>
              {logoSrc && <Image src={logoSrc} style={styles.logo} />}
              <View>
                <Text style={styles.companyName}>{storeName}</Text>
                <Text style={styles.companyLine}>{storeLocation}</Text>
                <Text style={styles.companyLine}>{storePhone}</Text>
              </View>
            </View>
            <View>
              <Text style={styles.badge}>QUOTATION</Text>
              <Text style={styles.documentNumber}>{quotationNumber}</Text>
            </View>
          </View>

          {/* Info Row */}
          <View style={[styles.section, styles.infoGrid]}>
            <View style={styles.infoColumn}>
              <Text style={styles.label}>Quotation #</Text>
              <Text style={styles.value}>{quotationNumber}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{date}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.label}>Status</Text>
              <Text style={[styles.value, { color: status === "Accepted" ? colors.success : status === "Declined" ? "#dc2626" : colors.primary }]}>
                {statusLabel(status)}
              </Text>
            </View>
          </View>

          {/* Customer */}
          <View style={styles.section}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.customerLine}>{customerPhone}</Text>
            {customerEmail && <Text style={styles.customerLine}>{customerEmail}</Text>}
          </View>

          {/* Items Table */}
          <View style={styles.section}>
            <Text style={[styles.label, { marginBottom: 10 }]}>Quoted Items</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.description]}>Description</Text>
              <Text style={[styles.headerText, styles.sku]}>SKU</Text>
              <Text style={[styles.headerText, styles.qty]}>Qty</Text>
              <Text style={[styles.headerText, styles.price]}>Price</Text>
              <Text style={[styles.headerText, styles.total]}>Total</Text>
            </View>
            {items.map((item, index) => (
              <View key={`${item.name}-${index}`} style={styles.tableRow} wrap={false}>
                <Text style={[styles.cell, styles.description]}>{item.name}</Text>
                <Text style={[styles.cell, styles.sku, { fontSize: 7 }]}>{item.sku || "—"}</Text>
                <Text style={[styles.cell, styles.qty]}>{item.quantity}</Text>
                <Text style={[styles.cell, styles.price]}>{formatCurrency(item.unitPrice)}</Text>
                <Text style={[styles.cell, styles.total]}>{formatCurrency(item.total)}</Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.section}>
            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
              </View>
              <View style={styles.grandTotal}>
                <Text style={styles.grandText}>Total</Text>
                <Text style={[styles.grandText, { color: colors.primary }]}>{formatCurrency(subtotal)}</Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          {notes && (
            <View style={styles.section}>
              <Text style={[styles.label, { marginBottom: 6 }]}>Notes</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{notes}</Text>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{storeName} — {storeLocation}</Text>
            <Text style={styles.footerText}>{storeEmail} — {storePhone}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
