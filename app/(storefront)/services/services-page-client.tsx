"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Phone,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp-url";
import { fadeUpVariants, motionTransition } from "@/lib/motion";
import { getServiceIcon } from "@/lib/service-icons";
import type { ServiceRecord, ServicesPageSettings } from "@/lib/services";

interface Props {
  services: ServiceRecord[];
  pageSettings: ServicesPageSettings;
  storeWhatsapp: string;
  storePhone: string;
}

export default function ServicesPageClient({
  services,
  pageSettings,
  storeWhatsapp,
  storePhone,
}: Props) {
  const { header, supportCards, preOwnedTech, bottomCta } = pageSettings;
  const filteredSupportCards = supportCards.filter((c) => c.isEnabled);
  const enabledSupportCards = filteredSupportCards.sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      {/* Hero */}
      <section className="bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          {header.eyebrow && (
            <motion.p
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              transition={motionTransition(false, 0.25)}
              className="text-xs font-semibold uppercase tracking-wider text-primary mb-3"
            >
              {header.eyebrow}
            </motion.p>
          )}
          <motion.h1
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            transition={motionTransition(false, 0.3)}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
          >
            {header.heading || "Our Services"}
          </motion.h1>
          {header.description && (
            <motion.p
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              transition={motionTransition(false, 0.38)}
              className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              {header.description}
            </motion.p>
          )}
        </div>
      </section>

      {/* Services List */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20">
          {services.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No services available yet. Check back soon.</p>
            </div>
          )}
          {services.map((service, idx) => {
            const Icon = getServiceIcon(service.icon);
            const isReversed = idx % 2 === 1;
            return (
              <motion.div
                key={service.id}
                variants={fadeUpVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.12 }}
                transition={motionTransition(false, 0.3 + idx * 0.08)}
                className="grid md:grid-cols-2 gap-8 md:gap-12 items-center"
              >
                {/* Image */}
                <div className={isReversed ? "md:order-2" : ""}>
                  <div className="relative aspect-[3/2] rounded-2xl overflow-hidden border border-border shadow-md bg-muted">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-accent/30">
                        <Icon className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className={isReversed ? "md:order-1" : ""}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary mb-5">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {service.title}
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>

                  {service.features.length > 0 && (
                    <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {service.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {service.primaryCtaVisible && renderServiceCta(
                      service.primaryCtaType,
                      service.primaryCtaLabel,
                      service.primaryCtaDest,
                      service.title,
                      storeWhatsapp,
                      storePhone,
                      true,
                    )}
                    {service.secondaryCtaVisible && renderServiceCta(
                      service.secondaryCtaType,
                      service.secondaryCtaLabel,
                      service.secondaryCtaDest,
                      service.title,
                      storeWhatsapp,
                      storePhone,
                      false,
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Supporting Services */}
      {enabledSupportCards.length > 0 && (
        <section className="border-t border-border bg-muted py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-7 max-w-xl">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {pageSettings.supportSectionHeading || "Support beyond the main service"}
              </h2>
              {pageSettings.supportSectionDescription && (
                <p className="mt-1 text-sm text-muted-foreground">{pageSettings.supportSectionDescription}</p>
              )}
            </div>

            <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
              {enabledSupportCards.map((card) => {
                const Icon = getServiceIcon(card.icon);
                return (
                  <div key={card.id} className="flex gap-4 bg-background p-5 sm:p-6">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{card.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {card.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Pre-Owned Technology */}
      {preOwnedTech.isEnabled && (
        <section className="border-t border-border bg-muted py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  {(() => {
                    const PreOwnedIcon = getServiceIcon(preOwnedTech.icon);
                    return <PreOwnedIcon className="h-5 w-5" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground">{preOwnedTech.title}</h3>
                  <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {preOwnedTech.description}
                  </p>
                  {preOwnedTech.features.length > 0 && (
                    <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                      {preOwnedTech.features.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-background border-t border-border py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {bottomCta.heading}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {bottomCta.description}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {renderBottomCta(
              bottomCta.primaryCtaType,
              bottomCta.primaryCtaLabel,
              bottomCta.primaryCtaDest,
              storeWhatsapp,
            )}
            {renderBottomCta(
              bottomCta.secondaryCtaType,
              bottomCta.secondaryCtaLabel,
              bottomCta.secondaryCtaDest,
              storeWhatsapp,
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function renderServiceCta(
  type: string,
  label: string,
  dest: string | null,
  serviceTitle: string,
  whatsapp: string,
  phone: string,
  isPrimary: boolean,
) {
  if (type === "whatsapp" && whatsapp) {
    return (
      <a
        key={`whatsapp-${serviceTitle}`}
        href={buildWhatsAppUrl(whatsapp, `Hello FusionZone, I would like to enquire about ${serviceTitle}.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-whatsapp/20 bg-whatsapp-soft px-5 py-2.5 text-sm font-semibold text-whatsapp transition-all hover:-translate-y-0.5 hover:border-whatsapp/30 hover:bg-whatsapp hover:text-white"
      >
        <MessageCircle className="h-4 w-4" />
        {label || "Enquire Now"}
      </a>
    );
  }

  if (type === "phone" && phone) {
    return (
      <a
        key={`phone-${serviceTitle}`}
        href={`tel:${phone}`}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
      >
        <Phone className="h-4 w-4" />
        {label || "Call Us"}
      </a>
    );
  }

  if (type === "contact") {
    return (
      <Link
        key={`contact-${serviceTitle}`}
        href="/contact"
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
      >
        {label || "Contact Us"}
      </Link>
    );
  }

  if (type === "custom_link" && dest) {
    return (
      <a
        key={`link-${serviceTitle}`}
        href={dest}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
      >
        {label || "Learn More"}
      </a>
    );
  }

  return null;
}

function renderBottomCta(
  type: string,
  label: string,
  dest: string | null,
  whatsapp: string,
) {
  if (type === "whatsapp" && whatsapp) {
    return (
      <a
        key="bottom-whatsapp"
        href={buildWhatsAppUrl(whatsapp, "Hi FusionZone, I need help with a custom technology solution.")}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-whatsapp/20 bg-whatsapp-soft px-6 py-3 text-sm font-semibold text-whatsapp transition-all hover:-translate-y-0.5 hover:border-whatsapp/30 hover:bg-whatsapp hover:text-white hover:shadow-md"
      >
        <MessageCircle className="h-5 w-5" />
        {label || "Chat on WhatsApp"}
      </a>
    );
  }

  if (type === "contact") {
    return (
      <Link
        key="bottom-contact"
        href="/contact"
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted hover:shadow-sm"
      >
        {label || "Send Enquiry"}
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  if (type === "phone") {
    return (
      <a
        key="bottom-phone"
        href={`tel:${whatsapp}`}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted hover:shadow-sm"
      >
        <Phone className="h-5 w-5" />
        {label || "Call Us"}
      </a>
    );
  }

  if (type === "custom_link" && dest) {
    return (
      <a
        key="bottom-custom"
        href={dest}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted hover:shadow-sm"
      >
        {label || "Learn More"}
        <ArrowRight className="h-4 w-4" />
      </a>
    );
  }

  return null;
}
