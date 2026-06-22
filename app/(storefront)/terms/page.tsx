import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { getStoreSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const settings = await getStoreSettings();
  const phoneNumber = settings.phone || "+264000000000";
  const storeEmail = settings.email || "sales@fusionzone.example";
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowRight className="h-4 w-4 rotate-180" />
        Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Terms &amp; Conditions</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 2025</p>
        </div>
      </div>

      <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. General</h2>
          <p className="leading-relaxed">
            These terms govern the use of the FusionZone website and the purchase
            of products and services from our store in Windhoek, Namibia. By placing an order or
            using this site, you agree to these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Product Information</h2>
          <p className="leading-relaxed">
            We make every effort to display accurate product descriptions, specifications, and images.
            However, actual product appearance and specifications may vary slightly. Condition labels
            (New, Refurbished, Pre-Owned) are applied honestly based on our assessment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Pricing &amp; Payment</h2>
          <p className="leading-relaxed">
            All prices are listed in Namibian Dollars (N$) and include applicable taxes. We accept
            cash at our store and bank transfers. Payment must be received before or upon collection.
            Prices are subject to change without notice, but confirmed orders will honour the quoted
            price.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Order Process</h2>
          <p className="leading-relaxed">
            Submitting an order request through our website constitutes an offer to purchase. We will
            contact you to confirm availability and arrange collection. No contract is formed until
            we have confirmed your order and payment terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Collection &amp; Delivery</h2>
          <p className="leading-relaxed">
            Standard collection is from our Windhoek location. Nationwide courier delivery can be
            arranged at additional cost. We are not responsible for delays caused by third-party
            courier services once the item has been dispatched.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Warranty &amp; Returns</h2>
          <p className="leading-relaxed">
            Warranty terms are provided at the time of sale and vary by product and condition.
            Warranty does not cover physical damage, water damage, unauthorised repairs, or normal
            wear and tear. Please inspect items at the time of collection.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
          <p className="leading-relaxed">
            FusionZone is not liable for indirect damages arising from the use or
            inability to use purchased products. Our total liability is limited to the purchase price
            of the product in question.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Contact</h2>
          <p className="leading-relaxed">
            For any questions about these terms, contact us via WhatsApp at {phoneNumber}, email
            at {storeEmail}, or visit our store in Windhoek.
          </p>
        </section>
      </div>
    </div>
  );
}
