import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteUrl, RULES_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Rules | How to Play Blink & Find",
  description: RULES_DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/rules"),
  },
  openGraph: {
    title: "Blink & Find Rules | How to Play",
    description: RULES_DESCRIPTION,
    url: absoluteUrl("/rules"),
    siteName: SITE_NAME,
    type: "article",
  },
};

const sections = [
  {
    title: "The goal",
    body: "Memorize the target number, then tap that same number on the scattered board as fast as you can.",
  },
  {
    title: "How a round works",
    body: "Each round starts with a short preview. When the target hides, the timer starts and the board becomes playable.",
  },
  {
    title: "Scoring",
    body: "Your score is your time plus penalties. The lower your total time, the better your result.",
  },
  {
    title: "Wrong taps",
    body: "Tapping the wrong number adds penalty seconds. You can keep playing, so do not panic. The board already has enough chaos.",
  },
  {
    title: "Winning",
    body: "After all rounds, the player with the lowest total time wins. If you are playing solo, try to beat your best score.",
  },
  {
    title: "Same Challenge",
    body: "Friends take turns on their own devices. Everyone gets the same target and the same board for a fair comparison.",
  },
  {
    title: "Live Race",
    body: "Everyone starts together after a shared countdown. The first player with the lowest final time leads the round.",
  },
  {
    title: "Difficulty",
    body: "Easy has fewer tiles and is best for new players. Normal is the recommended start. Hard is dense, fast, and slightly rude.",
  },
];

export default function RulesPage() {
  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto grid min-h-full w-full max-w-5xl gap-4 py-4">
        <Card className="overflow-hidden">
          <CardHeader className="border-b text-center">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit">Game Guide</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-5xl">How to play Blink & Find</CardTitle>
            <CardDescription className="mx-auto max-w-2xl">
              A quick, friendly guide for new players. Read it once, then go hunt numbers like a tiny detective with excellent eyesight.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            {sections.map((section, index) => (
              <article key={section.title} className="rounded-xl border bg-muted/20 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{section.body}</p>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle>Quick examples</CardTitle>
            <CardDescription>Here is what the game is quietly calculating while you are busy tapping squares.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-3 sm:p-5">
            <div className="rounded-xl border bg-muted/20 p-4">
              <h3 className="mb-2 font-semibold">Clean round</h3>
              <p className="text-muted-foreground">You find the target in 4.20s with no wrong taps. Your round time is 4.20s.</p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <h3 className="mb-2 font-semibold">Penalty round</h3>
              <p className="text-muted-foreground">You find it in 4.20s with one wrong tap and a 3s penalty. Final time: 7.20s.</p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <h3 className="mb-2 font-semibold">Online room</h3>
              <p className="text-muted-foreground">Share the room link or QR code. Your friend joins, then you play the same challenge together.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild size="lg"><Link href="/">Play Now</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/online">Play with a Friend</Link></Button>
        </div>
      </section>
    </main>
  );
}
