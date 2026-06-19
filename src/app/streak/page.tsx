import type { Metadata } from "next";
import StreakMode from "@/components/StreakMode";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Play Blink & Find Streak Mode. Keep finding hidden target numbers until one wrong tap ends the run.";

export const metadata: Metadata = {
  title: "Streak Mode | Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/streak"),
  },
  openGraph: {
    title: "Blink & Find Streak Mode",
    description,
    url: absoluteUrl("/streak"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function StreakPage() {
  return <StreakMode />;
}
