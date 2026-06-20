import type { Metadata } from "next";
import LeaderboardPageClient from "@/components/LeaderboardPageClient";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Compare Blink & Find times on local and global leaderboards.";

export const metadata: Metadata = {
  title: "Leaderboard | Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/leaderboard"),
  },
  openGraph: {
    title: "Blink & Find Leaderboard",
    description,
    url: absoluteUrl("/leaderboard"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function LeaderboardPage() {
  return <LeaderboardPageClient />;
}
