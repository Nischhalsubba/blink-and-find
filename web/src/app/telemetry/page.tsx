import type { Metadata } from "next";
import TelemetryDashboard from "@/components/TelemetryDashboard";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Inspect local Blink & Find analytics events and client error reports for QA.";

export const metadata: Metadata = {
  title: "Telemetry | Blink & Find",
  description,
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: absoluteUrl("/telemetry"),
  },
  openGraph: {
    title: "Blink & Find Telemetry",
    description,
    url: absoluteUrl("/telemetry"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function TelemetryPage() {
  return <TelemetryDashboard />;
}
