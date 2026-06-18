import type { Metadata, Viewport } from "next";
import { absoluteUrl, getGameJsonLd, SEO_KEYWORDS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "Blink & Find | Free Number Hunting Memory Game",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: "Nischhal Subba" }],
  creator: "Nischhal Subba",
  publisher: "Nischhal Subba",
  category: "game",
  manifest: "/manifest.json",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    title: "Blink & Find | Free Number Hunting Memory Game",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Blink & Find scattered number memory game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blink & Find | Free Number Hunting Memory Game",
    description: SITE_DESCRIPTION,
    images: ["/og-image.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

/**
 * Root layout for the entire app.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getGameJsonLd()) }}
        />
        {children}
      </body>
    </html>
  );
}
