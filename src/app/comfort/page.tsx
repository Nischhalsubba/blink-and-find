import type { Metadata } from "next";
import ComfortMode from "@/components/ComfortMode";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Play Blink & Find Comfort Mode with a smaller board, larger tiles, longer preview, and gentler penalties for kids, seniors, and first-time players.";

export const metadata: Metadata = {
  title: "Comfort Mode | Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/comfort"),
  },
  openGraph: {
    title: "Blink & Find Comfort Mode",
    description,
    url: absoluteUrl("/comfort"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function ComfortPage() {
  return <ComfortMode />;
}
