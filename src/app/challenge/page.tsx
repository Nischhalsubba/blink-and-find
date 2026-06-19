import type { Metadata } from "next";
import SharedChallengeMode from "@/components/SharedChallengeMode";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Play a shared Blink & Find challenge link with the same seeded board and target as your friends.";

export const metadata: Metadata = {
  title: "Shared Challenge | Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/challenge"),
  },
  openGraph: {
    title: "Blink & Find Shared Challenge",
    description,
    url: absoluteUrl("/challenge"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function ChallengePage() {
  return <SharedChallengeMode />;
}
