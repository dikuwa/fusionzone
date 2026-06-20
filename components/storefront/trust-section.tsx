import { Package, Users, ShieldCheck, HeadphonesIcon } from "lucide-react";

const reasons = [
  {
    title: "Clear product condition",
    description: "New, refurbished and pre-owned items are labelled before you commit.",
    icon: Package,
  },
  {
    title: "Human buying help",
    description: "Message or call for guidance when specs and compatibility matter.",
    icon: Users,
  },
  {
    title: "Invoice and payment clarity",
    description: "Cash at store or bank transfer with clear purchase records.",
    icon: ShieldCheck,
  },
  {
    title: "After-sales support",
    description: "Warranty notes and follow-up support stay close to the sale.",
    icon: HeadphonesIcon,
  },
];

export function TrustSection() {
  return (
    <section className="bg-muted py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Built for practical buying
          </p>
          <h2 className="mt-1 text-3xl font-semibold text-foreground">
            Why customers choose FusionZone
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Electronics purchases need trust, availability and quick answers. The store experience is shaped around those basics.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <div
                key={reason.title}
                className="bg-card p-6 transition-colors hover:bg-background"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-foreground">
                  {reason.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {reason.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
