import { getEnabledServices, getServices, DEFAULT_SERVICES_PAGE_SETTINGS } from "@/lib/services";
import { getStoreSettings } from "@/lib/store-settings";
import ServicesPageClient from "./services-page-client";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([
    getEnabledServices(),
    getStoreSettings(),
  ]);

  const pageSettings = settings.servicesPage ?? DEFAULT_SERVICES_PAGE_SETTINGS;

  return (
    <ServicesPageClient
      services={services}
      pageSettings={pageSettings}
      storeWhatsapp={settings.whatsapp}
      storePhone={settings.phone}
    />
  );
}
