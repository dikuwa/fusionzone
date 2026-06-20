"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Wifi,
  Printer,
  Wrench,
  MessageCircle,
  Phone,
  ArrowRight,
  CheckCircle2,
  Drill,
  MessagesSquare,
  CircleHelp,
  Laptop,
} from "lucide-react";
import { useDashboardStore } from "@/lib/store/dashboard";
import { buildWhatsAppUrl } from "@/lib/whatsapp-url";
import { fadeUpVariants, motionTransition } from "@/lib/motion";

const services = [
  {
    title: "CCTV & Security",
    description: "Professional security solutions for homes and businesses. We supply and install camera systems, access control, and alarm systems.",
    icon: Shield,
    features: [
      "HD & 4K camera systems",
      "NVR and DVR recorders",
      "Access control systems",
      "Alarm systems",
      "Remote viewing setup",
      "Maintenance and support",
    ],
    image: "/images/services/cctv-security.png",
  },
  {
    title: "Networking",
    description: "Complete networking solutions for reliable connectivity. From home WiFi to enterprise networks.",
    icon: Wifi,
    features: [
      "WiFi 6/6E access points",
      "Network switches & routers",
      "Structured cabling",
      "Fiber optic installations",
      "Network security",
      "Managed WiFi solutions",
    ],
    image: "/images/services/networking.png",
  },
  {
    title: "POS Systems",
    description: "Point of sale hardware and software solutions for retail, hospitality, and service businesses.",
    icon: Printer,
    features: [
      "POS terminals & printers",
      "Barcode scanners",
      "Receipt printers",
      "Cash drawers",
      "Software setup",
      "Ongoing support",
    ],
    image: "/images/services/pos-systems.png",
  },
  {
    title: "Auto & Mechanical",
    description: "Vehicle diagnostic equipment, mechanical service tools, and specialized automotive technology solutions.",
    icon: Wrench,
    features: [
      "Diagnostic scanners",
      "Service tools",
      "Workshop equipment",
      "Auto tech solutions",
      "Installation services",
      "Technical support",
    ],
    image: "/images/services/auto-mechanical.png",
  },
];

const supportServices = [
  {
    title: "Product Installation",
    description: "Professional installation and setup for security, networking, POS, and technology products purchased from us.",
    icon: Drill,
  },
  {
    title: "Solution Consultation",
    description: "Practical guidance to help you choose the right technology, security, networking, or POS solution for your home or business.",
    icon: MessagesSquare,
  },
  {
    title: "Guided DIY Support",
    description: "Remote guidance for customers who prefer to install, configure, or troubleshoot their systems with expert support.",
    icon: CircleHelp,
  },
];

export default function ServicesPage() {
  const settings = useDashboardStore((s) => s.settings);
  return (
    <div>
      {/* Hero */}
      <section className="bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <motion.h1
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            transition={motionTransition(false, 0.3)}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
          >
            Our Services
          </motion.h1>
          <motion.p
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            transition={motionTransition(false, 0.38)}
            className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Professional technology services throughout Namibia. Installation, setup,
            maintenance, and support for homes and businesses.
          </motion.p>
        </div>
      </section>

      {/* Services List */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20">
          {services.map((service, idx) => {
            const Icon = service.icon;
            const isReversed = idx % 2 === 1;
            return (
              <motion.div
                key={service.title}
                variants={fadeUpVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.12 }}
                transition={motionTransition(false, 0.3 + idx * 0.08)}
                className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center`}
              >
                {/* Image */}
                <div className={`${isReversed ? "md:order-2" : ""}`}>
                  <div className="relative aspect-[3/2] rounded-2xl overflow-hidden border border-border shadow-md">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
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

                  <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {settings.whatsapp && (
                      <a
                        href={buildWhatsAppUrl(settings.whatsapp, `Hi, I'm interested in your ${service.title} services.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-whatsapp/20 bg-whatsapp-soft px-5 py-2.5 text-sm font-semibold text-whatsapp transition-all hover:-translate-y-0.5 hover:border-whatsapp/30 hover:bg-whatsapp hover:text-white"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Enquire Now
                      </a>
                    )}
                    {settings.phone && (
                      <a
                        href={`tel:${settings.phone}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
                      >
                        <Phone className="h-4 w-4" />
                        Call Us
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Supporting Services */}
      <section className="border-t border-border bg-muted py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Also available
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground">
              Support beyond the main service
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
            {supportServices.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.title} className="flex gap-4 bg-background p-5 sm:p-6">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{service.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-background p-5 sm:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <Laptop className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground">We Buy Selected Pre-Owned Tech</h3>
                <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  Have a laptop, electronic gadget, or tech device you no longer use? FusionZone buys selected pre-owned laptops, electronics, and related technology items after inspection and condition checks.
                </p>
                <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                  {["Pre-owned laptops", "Selected electronic gadgets", "Computer accessories", "Tech devices in good working condition", "Inspection before purchase", "Fair condition-based offers"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background border-t border-border py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Need a custom solution?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Contact us to discuss your specific requirements. We provide free site assessments.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {settings.whatsapp && (
              <a
                href={buildWhatsAppUrl(settings.whatsapp, "Hi FusionZone, I need help with a custom technology solution.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-whatsapp/20 bg-whatsapp-soft px-6 py-3 text-sm font-semibold text-whatsapp transition-all hover:-translate-y-0.5 hover:border-whatsapp/30 hover:bg-whatsapp hover:text-white hover:shadow-md"
              >
                <MessageCircle className="h-5 w-5" />
                Chat on WhatsApp
              </a>
            )}
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted hover:shadow-sm"
            >
              Send Enquiry
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
