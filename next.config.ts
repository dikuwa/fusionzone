import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingIncludes: {
    "/api/receipts/generate": [
      "./public/fonts/*.ttf",
      "./public/images/fusionzone-logo-pdf.png",
    ],
    "/api/documents/share/[token]": [
      "./public/fonts/*.ttf",
      "./public/images/fusionzone-logo-pdf.png",
    ],
    "/d/[code]/pdf": [
      "./public/fonts/*.ttf",
      "./public/images/fusionzone-logo-pdf.png",
    ],
    "/d/[code]/download": [
      "./public/fonts/*.ttf",
      "./public/images/fusionzone-logo-pdf.png",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
