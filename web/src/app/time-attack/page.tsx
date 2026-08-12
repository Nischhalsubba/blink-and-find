import type { Metadata } from "next";
import TimeAttackMode from "@/components/TimeAttackMode";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Play Blink & Find Time Attack, a 60-second number hunting sprint where you find as many targets as possible before the clock runs out.";

export const metadata: Metadata = {
  title: "Time Attack | Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/time-attack"),
  },
  openGraph: {
    title: "Blink & Find Time Attack",
    description,
    url: absoluteUrl("/time-attack"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function TimeAttackPage() {
  return <TimeAttackMode />;
}
