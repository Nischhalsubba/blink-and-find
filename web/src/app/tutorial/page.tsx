import type { Metadata } from "next";
import TutorialExperience from "@/components/TutorialExperience";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Learn Blink & Find in one tiny practice round. Memorize the target, find it on the board, and understand wrong-tap penalties before playing.";

export const metadata: Metadata = {
  title: "Tutorial | Learn Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/tutorial"),
  },
  openGraph: {
    title: "Blink & Find Tutorial",
    description,
    url: absoluteUrl("/tutorial"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function TutorialPage() {
  return <TutorialExperience />;
}
