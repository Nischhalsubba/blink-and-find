import type { Metadata } from "next";
import ZenMode from "@/components/ZenMode";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Play Blink & Find Zen Mode with endless calm boards, visible targets, no timer, and no score pressure.";

export const metadata: Metadata = {
  title: "Zen Mode | Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/zen"),
  },
  openGraph: {
    title: "Blink & Find Zen Mode",
    description,
    url: absoluteUrl("/zen"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function ZenPage() {
  return <ZenMode />;
}
