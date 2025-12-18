import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientProvider from "@/components/ui/ClientProvider";
import ConditionalLayout from "@/components/ConditionalLayout";
import { checkUserAuth } from "@/lib/server/auth";
import PwaServiceWorkerRegister from "@/components/PwaServiceWorkerRegister";
import PwaInstallOverlay from "@/components/PwaInstallOverlay";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://sequentialhub.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sequential Hub - Premium Custom Clothing",
    template: "%s | Sequential Hub",
  },
  description:
    "Your premier destination for custom-tailored clothing and accessories. We bring style and quality together for the modern individual.",
  keywords: [
    "clothing",
    "fashion",
    "custom tailoring",
    "mens clothing",
    "womens clothing",
    "accessories",
  ],
  authors: [{ name: "Sequential Hub" }],
  creator: "Sequential Hub",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Sequential Hub",
    title: "Sequential Hub - Premium Custom Clothing",
    description:
      "Your premier destination for custom-tailored clothing and accessories.",
    images: [
      {
        url: "/logo/og-default.png",
        width: 1200,
        height: 630,
        alt: "Sequential Hub - Premium Custom Clothing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sequential Hub - Premium Custom Clothing",
    description:
      "Your premier destination for custom-tailored clothing and accessories.",
    images: ["/logo/og-default.png"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sequential Hub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0071e3",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check auth on server side before client loads
  const authState = await checkUserAuth();

  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        <PwaServiceWorkerRegister />
        <PwaInstallOverlay />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="min-h-screen flex flex-col relative bg-watermark">
          <div className="relative z-[1]">
            <ClientProvider initialAuthState={authState}>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </ClientProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
