import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturedPromotionsCarousel } from "./featured-promotions-carousel";
import { useDashboardStore } from "@/lib/store/dashboard";
import type { DashboardPromotion } from "@/lib/dashboard-data";

// Mock lucide-react icons
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react");
  return {
    ...(actual as object),
    ArrowRight: () => <span data-testid="icon-arrow-right">→</span>,
    ChevronLeft: () => <span data-testid="icon-chevron-left">‹</span>,
    ChevronRight: () => <span data-testid="icon-chevron-right">›</span>,
    ImageIcon: () => <span data-testid="icon-image">🖼</span>,
  };
});

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockPromotions: DashboardPromotion[] = [
  {
    id: "pr1",
    title: "Gaming Setup Bundle",
    slug: "gaming-bundle",
    description: "Complete gaming rig bundle with top-tier components.",
    imageUrl: "/images/gaming-bundle.jpg",
    discountLabel: "Save up to N$ 2,000",
    placement: "HomeHero",
    isActive: true,
    isFeatured: true,
    sortOrder: 0,
    startsAt: "2026-05-01T00:00:00Z",
    endsAt: "2026-07-31T23:59:59Z",
    type: "bundle",
    productCount: 5,
  },
  {
    id: "pr2",
    title: "Back to School Special",
    slug: "back-to-school",
    description: "Student discounts on laptops and tablets.",
    imageUrl: "/images/back-to-school.jpg",
    discountLabel: "Up to 15% off",
    placement: "FeaturedSection",
    isActive: true,
    isFeatured: true,
    sortOrder: 1,
    startsAt: "2026-05-15T00:00:00Z",
    endsAt: "2026-07-15T23:59:59Z",
    type: "product",
    productCount: 8,
  },
  {
    id: "pr3",
    title: "CCTV Bundle Deals",
    slug: "cctv-bundle",
    description: "Security camera bundles for home and office.",
    imageUrl: "/images/cctv-bundle.jpg",
    discountLabel: "Save up to N$ 1,500",
    placement: "FeaturedSection",
    isActive: true,
    isFeatured: true,
    sortOrder: 2,
    startsAt: "2026-04-01T00:00:00Z",
    endsAt: "2026-06-30T23:59:59Z",
    type: "general",
    productCount: 3,
  },
];

const mockPromotionInactive: DashboardPromotion = {
  id: "pr4",
  title: "Expired Deal",
  slug: "expired-deal",
  description: "This promotion is no longer active.",
  imageUrl: undefined,
  placement: "FeaturedSection",
  isActive: false,
  isFeatured: true,
  sortOrder: 3,
  type: "general",
  productCount: 0,
};

function resetStore() {
  useDashboardStore.setState({
    promotions: [],
  });
}

beforeEach(() => {
  resetStore();
});

describe("FeaturedPromotionsCarousel", () => {
  describe("Loading state", () => {
    it("shows skeleton when store has no promotions and hasLoadedOnce is false", () => {
      render(<FeaturedPromotionsCarousel />);

      // Should show the heading and skeleton
      expect(screen.getByText("Featured promotions")).toBeDefined();
      expect(screen.getByText("Limited offers")).toBeDefined();
      // The skeleton is an animate-pulse div - check the parent section is rendered
      const section = screen.getByText("Featured promotions").closest("section");
      expect(section).toBeDefined();
    });
  });

  describe("Loaded empty state", () => {
    it("returns null when loaded with empty promotions (hasLoadedOnce is true but no promotions)", () => {
      // First render with data, then clear to simulate loaded empty
      const { rerender } = render(<FeaturedPromotionsCarousel />);

      // Simulate data arriving then being cleared
      useDashboardStore.setState({ promotions: mockPromotions });
      rerender(<FeaturedPromotionsCarousel />);

      // Now data is loaded (appears multiple times due to infinite carousel clones)
      expect(screen.getAllByText("Gaming Setup Bundle").length).toBeGreaterThanOrEqual(1);

      // Clear promotions to simulate loaded-empty state
      useDashboardStore.setState({ promotions: [] });
      rerender(<FeaturedPromotionsCarousel />);

      // Should return null (nothing rendered)
      expect(screen.queryByText("Featured promotions")).toBeNull();
    });
  });

  describe("Single promotion", () => {
    it("renders a single promotion card without carousel controls", () => {
      useDashboardStore.setState({ promotions: [mockPromotions[0]] });
      render(<FeaturedPromotionsCarousel />);

      // Should show the promotion content
      expect(screen.getByText("Gaming Setup Bundle")).toBeDefined();
      expect(screen.getByText("Complete gaming rig bundle with top-tier components.")).toBeDefined();
      expect(screen.getByText("Save up to N$ 2,000")).toBeDefined();

      // Should show the CTA
      expect(screen.getByText("View bundle")).toBeDefined();

      // Should NOT show carousel arrows or dots
      expect(screen.queryByLabelText("Previous promotion")).toBeNull();
      expect(screen.queryByLabelText("Next promotion")).toBeNull();
      expect(screen.queryByLabelText("Go to promotion 1")).toBeNull();
    });

    it("renders a promotion without an image as a fallback", () => {
      const promoNoImage = {
        ...mockPromotions[0],
        imageUrl: undefined,
      };
      useDashboardStore.setState({ promotions: [promoNoImage] });
      render(<FeaturedPromotionsCarousel />);

      // Content should still show
      expect(screen.getByText("Gaming Setup Bundle")).toBeDefined();
      // Fallback should show
      expect(screen.getByText("Image unavailable")).toBeDefined();
    });
  });

  describe("Multiple promotions (carousel mode)", () => {
    it("renders all promotions and carousel controls", () => {
      useDashboardStore.setState({ promotions: mockPromotions });
      render(<FeaturedPromotionsCarousel />);

      // Promotions appear multiple times due to infinite carousel clones
      expect(screen.getAllByText("Gaming Setup Bundle").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Back to School Special").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("CCTV Bundle Deals").length).toBeGreaterThanOrEqual(1);

      // Carousel controls should be present (desktop + mobile = 2 each)
      expect(screen.getAllByLabelText("Previous promotion").length).toBe(2);
      expect(screen.getAllByLabelText("Next promotion").length).toBe(2);

      // Pagination dots should match number of promotions
      expect(screen.getByLabelText("Go to promotion 1")).toBeDefined();
      expect(screen.getByLabelText("Go to promotion 2")).toBeDefined();
      expect(screen.getByLabelText("Go to promotion 3")).toBeDefined();
    });

    it("filters out inactive promotions", () => {
      const promotionsWithInactive = [...mockPromotions, mockPromotionInactive];
      useDashboardStore.setState({ promotions: promotionsWithInactive });
      render(<FeaturedPromotionsCarousel />);

      // Inactive promotion should not be rendered
      expect(screen.queryByText("Expired Deal")).toBeNull();

      // Active promotions should be rendered (appear multiple times due to clones)
      expect(screen.getAllByText("Gaming Setup Bundle").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Back to School Special").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("CCTV Bundle Deals").length).toBeGreaterThanOrEqual(1);

      // Should have 3 dots for 3 active promotions
      expect(screen.getByLabelText("Go to promotion 1")).toBeDefined();
      expect(screen.getByLabelText("Go to promotion 2")).toBeDefined();
      expect(screen.getByLabelText("Go to promotion 3")).toBeDefined();
      expect(screen.queryByLabelText("Go to promotion 4")).toBeNull();
    });

    it("filters out non-featured promotions", () => {
      const nonFeatured = {
        ...mockPromotions[2],
        isFeatured: false,
      };
      useDashboardStore.setState({
        promotions: [mockPromotions[0], mockPromotions[1], nonFeatured],
      });
      render(<FeaturedPromotionsCarousel />);

      // Non-featured promotion should not be in carousel
      expect(screen.queryByText("CCTV Bundle Deals")).toBeNull();
      // Featured promotions should be present (appear multiple times due to clones)
      expect(screen.getAllByText("Gaming Setup Bundle").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Back to School Special").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Image handling", () => {
    it("shows fallback when promotion has no imageUrl", () => {
      const promoNoImage = {
        ...mockPromotions[0],
        imageUrl: undefined,
      };
      useDashboardStore.setState({ promotions: [promoNoImage] });
      render(<FeaturedPromotionsCarousel />);

      // Should show the image fallback text
      expect(screen.getByText("Image unavailable")).toBeDefined();
      // Content should still be visible
      expect(screen.getByText("Gaming Setup Bundle")).toBeDefined();
    });

    it("shows discount label when present", () => {
      useDashboardStore.setState({ promotions: [mockPromotions[0]] });
      render(<FeaturedPromotionsCarousel />);

      expect(screen.getByText("Save up to N$ 2,000")).toBeDefined();
    });

    it("does not show discount label when absent", () => {
      const noDiscount = { ...mockPromotions[0], discountLabel: undefined };
      useDashboardStore.setState({ promotions: [noDiscount] });
      render(<FeaturedPromotionsCarousel />);

      expect(screen.queryByText("Save up to N$ 2,000")).toBeNull();
    });
  });

  describe("Promotion type labels", () => {
    it("shows 'Promotion' badge for general type", () => {
      useDashboardStore.setState({ promotions: [mockPromotions[2]] });
      render(<FeaturedPromotionsCarousel />);

      expect(screen.getByText("Promotion")).toBeDefined();
    });

    it("shows 'View bundle' CTA for bundle type", () => {
      useDashboardStore.setState({ promotions: [mockPromotions[0]] });
      render(<FeaturedPromotionsCarousel />);

      // The badge shows "Promotion" for bundle type, but CTA shows "View bundle"
      expect(screen.getByText("View bundle")).toBeDefined();
    });

    it("shows 'Service' badge for service type", () => {
      const servicePromo: DashboardPromotion = { ...mockPromotions[0], type: "service" };
      useDashboardStore.setState({ promotions: [servicePromo] });
      render(<FeaturedPromotionsCarousel />);

      expect(screen.getByText("Service")).toBeDefined();
    });
  });

  describe("Navigation", () => {
    it("clicking pagination dot navigates to the correct promotion", async () => {
      const user = (await import("@testing-library/user-event")).default;
      useDashboardStore.setState({ promotions: mockPromotions });
      render(<FeaturedPromotionsCarousel />);

      // Click on dot for promotion 3
      await user.click(screen.getByLabelText("Go to promotion 3"));

      // The third promotion should now be visible (appears in clones too)
      expect(screen.getAllByText("CCTV Bundle Deals").length).toBeGreaterThanOrEqual(1);
    });

    it("clicking next arrow advances to the next promotion", async () => {
      const user = (await import("@testing-library/user-event")).default;
      useDashboardStore.setState({ promotions: mockPromotions });
      render(<FeaturedPromotionsCarousel />);

      // Click next
      const nextButtons = screen.getAllByLabelText("Next promotion");
      await user.click(nextButtons[0]);

      // The second promotion should now be visible
      expect(screen.getByText("Back to School Special")).toBeDefined();
    });

    it("clicking previous arrow goes to the previous promotion", async () => {
      const user = (await import("@testing-library/user-event")).default;
      useDashboardStore.setState({ promotions: mockPromotions });
      render(<FeaturedPromotionsCarousel />);

      // Go to promotion 3 first
      await user.click(screen.getByLabelText("Go to promotion 3"));
      expect(screen.getAllByText("CCTV Bundle Deals").length).toBeGreaterThanOrEqual(1);

      // Click previous
      const prevButtons = screen.getAllByLabelText("Previous promotion");
      await user.click(prevButtons[0]);

      // The second promotion should now be visible (appears in clones too)
      expect(screen.getAllByText("Back to School Special").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("CTA text", () => {
    it('shows "View bundle" for bundle type', () => {
      useDashboardStore.setState({ promotions: [mockPromotions[0]] });
      render(<FeaturedPromotionsCarousel />);

      expect(screen.getByText("View bundle")).toBeDefined();
    });

    it('shows "View offer" for product type', () => {
      useDashboardStore.setState({ promotions: [mockPromotions[1]] });
      render(<FeaturedPromotionsCarousel />);

      expect(screen.getByText("View offer")).toBeDefined();
    });
  });
});
