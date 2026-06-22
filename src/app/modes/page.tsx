import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Explore every Blink & Find game mode, including Practice, Daily Challenge, Time Attack, Streak, Comfort, Zen, Same Challenge, and Live Race.";

const modes = [
  { href: "/practice", title: "Practice", tag: "Beginner", description: "No timer pressure. Change difficulty, use hints, and learn the board calmly." },
  { href: "/daily", title: "Daily Challenge", tag: "Routine", description: "One shared challenge per day with the same target and board for everyone." },
  { href: "/time-attack", title: "Time Attack", tag: "Speed", description: "Find as many targets as possible in 60 seconds." },
  { href: "/streak", title: "Streak", tag: "Focus", description: "Keep a clean chain going. One wrong tap ends the run." },
  { href: "/comfort", title: "Comfort", tag: "Accessible", description: "Larger tiles, smaller board, longer preview, and gentler penalties." },
  { href: "/zen", title: "Zen", tag: "Relaxed", description: "Endless calm boards with no timer and no score pressure." },
  { href: "/online", title: "Same Challenge", tag: "Online", description: "Take turns on the same board and compare final times fairly." },
  { href: "/online", title: "Live Race", tag: "Online", description: "Both players race the same target at the same time after a shared countdown." },
  { href: "/challenge", title: "Challenge Link", tag: "Share", description: "Open a seeded board link so friends can play the exact same challenge." },
];

export const metadata: Metadata = {
  title: "Modes | Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/modes"),
  },
  openGraph: {
    title: "Blink & Find Game Modes",
    description,
    url: absoluteUrl("/modes"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function ModesPage() {
  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto grid min-h-full w-full max-w-6xl gap-5 py-4">
        <Card className="overflow-hidden border-white/70 bg-white/85 shadow-xl shadow-amber-950/5 backdrop-blur">
          <CardHeader className="border-b border-amber-100 p-6 text-center sm:p-8">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit rounded-full">Modes</Badge>
            <CardTitle className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">Choose your kind of play</CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-base leading-7">
              Every mode uses the same core skill: remember the target, scan the board, and avoid wrong taps.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-8 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
            {modes.map((mode) => (
              <Card key={`${mode.title}-${mode.tag}`} className="rounded-3xl border-white/70 bg-white/70 shadow-none">
                <CardHeader>
                  <Badge variant="outline" className="w-fit rounded-full">{mode.tag}</Badge>
                  <CardTitle className="text-xl font-black">{mode.title}</CardTitle>
                  <CardDescription>{mode.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full rounded-full"><Link href={mode.href}>Open {mode.title}</Link></Button>
                </CardFooter>
              </Card>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t border-amber-100 p-4 pt-6 sm:flex-row sm:justify-end sm:p-6">
            <Button asChild variant="outline" className="rounded-full"><Link href="/tips">Tips</Link></Button>
            <Button asChild className="rounded-full"><Link href="/">Play Now</Link></Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
