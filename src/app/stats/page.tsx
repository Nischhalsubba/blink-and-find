import type { Metadata } from "next";
import StatsDashboard from "@/components/StatsDashboard";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "View your Blink & Find personal stats, local best scores, practice rounds, daily challenge results, streak bests, and achievements.";

export const metadata: Metadata = {
  title: "Personal Stats | Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/stats"),
  },
  openGraph: {
    title: "Blink & Find Personal Stats",
    description,
    url: absoluteUrl("/stats"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function StatsPage() {
  return <StatsDashboard />;
}
