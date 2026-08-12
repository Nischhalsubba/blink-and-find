import type { Metadata } from "next";
import ProfileManager from "@/components/ProfileManager";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Manage your local Blink & Find player profile for stats, analytics, and leaderboard submissions.";

export const metadata: Metadata = {
  title: "Profile | Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/profile"),
  },
  openGraph: {
    title: "Blink & Find Profile",
    description,
    url: absoluteUrl("/profile"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function ProfilePage() {
  return <ProfileManager />;
}
