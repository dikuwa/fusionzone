"use client";

import { ServicesPageSettings } from "@/components/dashboard/services-page-settings";

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Services</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your services page — add, edit, reorder services, and customise the page layout.
        </p>
      </div>
      <ServicesPageSettings />
    </div>
  );
}
