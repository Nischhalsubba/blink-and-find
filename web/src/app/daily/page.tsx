import type { Metadata } from "next";
import DailyChallenge from "@/components/DailyChallenge";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Play today's Blink & Find Daily Challenge. Everyone gets the same target and scattered board, so you can compare times fairly.";

export const metadata: Metadata = {
  title: "Daily Challenge | Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/daily"),
  },
  openGraph: {
    title: "Blink & Find Daily Challenge",
    description,
    url: absoluteUrl("/daily"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function DailyPage() {
  return <DailyChallenge />;
}
