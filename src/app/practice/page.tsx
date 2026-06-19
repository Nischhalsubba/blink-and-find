import type { Metadata } from "next";
import PracticeMode from "@/components/PracticeMode";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Practice Blink & Find without timer pressure. Pick a difficulty, find targets at your own pace, use hints, and build confidence before a real game.";

export const metadata: Metadata = {
  title: "Practice Mode | Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/practice"),
  },
  openGraph: {
    title: "Blink & Find Practice Mode",
    description,
    url: absoluteUrl("/practice"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function PracticePage() {
  return <PracticeMode />;
}
