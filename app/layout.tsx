import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PageTransitionProvider } from "@/components/ui/page-transition-provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "FusionZone",
    template: "%s | FusionZone",
  },
  description:
    "New, pre-owned and refurbished technology products in Namibia. Apple, Windows, Gaming, CCTV, Networking, POS and more.",
  keywords: [
    "technology",
    "Namibia",
    "laptops",
    "desktops",
    "CCTV",
    "networking",
    "POS",
    "Apple",
    "gaming",
  ],
  icons: {
    icon: "/images/fusionzone-logo-blue.png",
    shortcut: "/images/fusionzone-logo-blue.png",
    apple: "/images/fusionzone-logo-blue.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {/* ── CSS-only initial loader — shows before React hydration ── */}
        <style
          id="fz-initial-loader-css"
          dangerouslySetInnerHTML={{
            __html: `
#dt-initial-loader {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  background: var(--color-background, #faf9f6);
}

#dt-initial-loader .dt-brand {
  display: flex;
  align-items: baseline;
  gap: 0.125rem;
  user-select: none;
}

#dt-initial-loader .dt-brand-name {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-foreground, #1a1a1a);
  font-family: ${spaceGrotesk.style.fontFamily};
}

#dt-initial-loader .dt-bar-track {
  width: 8rem;
  height: 0.25rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-muted, #e8e6e1);
}

#dt-initial-loader .dt-bar {
  height: 100%;
  width: 100%;
  border-radius: 999px;
  background: var(--color-primary, #0d41e2);
  animation: dt-loader-slide 1.4s ease-in-out infinite;
}

@keyframes dt-loader-slide {
  0%   { transform: translateX(-100%); width: 30%; }
  50%  { transform: translateX(200%); width: 50%; }
  100% { transform: translateX(450%); width: 30%; }
}
`,
          }}
        />
        <div id="dt-initial-loader">
          <div className="dt-brand">
            <span className="dt-brand-name">FusionZone</span>
          </div>
          <div className="dt-bar-track">
            <div className="dt-bar" />
          </div>
        </div>
        <Providers>
          <PageTransitionProvider>{children}</PageTransitionProvider>
        </Providers>
      </body>
    </html>
  );
}
