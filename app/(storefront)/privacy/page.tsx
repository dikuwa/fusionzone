import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getStoreSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
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
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 2025</p>
        </div>
      </div>

      <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
          <p className="leading-relaxed">
            FusionZone collects information you provide directly, such as your name,
            phone number, email address, and any details you share through our contact forms, WhatsApp
            conversations, or phone calls. We also collect basic browsing information through standard
            web server logs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
          <p className="leading-relaxed">
            We use your information solely to respond to enquiries, process orders, arrange product
            collection, and provide customer support. We do not use your data for marketing automation,
            sell it to third parties, or share it beyond what is necessary to fulfil your request.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Data Storage &amp; Security</h2>
          <p className="leading-relaxed">
            Order and contact information is stored securely and retained only as long as needed for
            business records and legal obligations. We implement reasonable technical measures to
            protect your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Third-Party Services</h2>
          <p className="leading-relaxed">
            We use WhatsApp and standard email for customer communication. These platforms have their
            own privacy policies. We do not integrate third-party analytics, advertising networks, or
            tracking services beyond basic website functionality.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Your Rights</h2>
          <p className="leading-relaxed">
            You may request access to, correction of, or deletion of your personal data at any time
            by contacting us directly. We will respond within a reasonable timeframe.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Contact</h2>
          <p className="leading-relaxed">
            For privacy-related enquiries, contact us via WhatsApp at {phoneNumber}, email at
            {storeEmail}, or visit our store in Windhoek, Namibia.
          </p>
        </section>
      </div>
    </div>
  );
}
