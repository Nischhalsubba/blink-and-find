import type { Metadata, Viewport } from "next";
import { Inter, Nunito_Sans } from "next/font/google";
import AppOnlinePresence from "@/components/AppOnlinePresence";
import AppTelemetry from "@/components/AppTelemetry";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
import { absoluteUrl, CREATOR_NAME, CREATOR_URL, getGameJsonLd, SEO_KEYWORDS, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/seo";
import "./globals.css";
import "./design-system.css";
import "./colorful.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-body" });
const nunitoSans = Nunito_Sans({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const SOCIAL_IMAGE_URL = absoluteUrl("/social-preview.png?v=clearplay-card-3");
const SOCIAL_IMAGE_ALT = "Blink & Find colorful number-memory game preview with bright scattered number tiles";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: CREATOR_NAME, url: CREATOR_URL }],
  creator: CREATOR_NAME,
  publisher: CREATOR_NAME,
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SOCIAL_IMAGE_URL,
        secureUrl: SOCIAL_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: SOCIAL_IMAGE_ALT,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SOCIAL_IMAGE_URL,
        alt: SOCIAL_IMAGE_ALT,
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff7fd",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${nunitoSans.variable}`}>
      <body>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getGameJsonLd()) }}
        />
        <AppTelemetry />
        <AppOnlinePresence />
        <SiteBreadcrumb />
        {children}
        <a
          href={CREATOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="creator-credit"
          aria-label={`Designed and coded by ${CREATOR_NAME}`}
        >
          <span>Designed &amp; coded by</span>
          <strong>{CREATOR_NAME}</strong>
        </a>
      </body>
    </html>
  );
}
