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
    body: "Easy has fewer tiles and is best for new players. Normal is the recommended start. Hard is dense and fast.",
  },
];

export default function RulesPage() {
  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto grid min-h-full w-full max-w-5xl gap-5 py-4">
        <Card className="overflow-hidden border-white/70 bg-white/85 shadow-xl shadow-amber-950/5 backdrop-blur">
          <CardHeader className="border-b border-amber-100 p-6 text-center sm:p-8">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit rounded-full">Game Guide</Badge>
            <CardTitle className="text-3xl font-black tracking-[-0.05em] sm:text-5xl">How to play Blink & Find</CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-base leading-7">
              A quick, friendly guide for new players. Read it once, then go hunt numbers like a tiny detective with excellent eyesight.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-8 sm:grid-cols-2 sm:p-8">
            {sections.map((section, index) => (
              <article key={section.title} className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full">{index + 1}</Badge>
                  <h2 className="text-lg font-black">{section.title}</h2>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{section.body}</p>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-white/70 bg-white/85 shadow-xl shadow-amber-950/5 backdrop-blur">
          <CardHeader className="border-b border-amber-100 p-6 sm:p-8">
            <CardTitle className="font-black">Quick examples</CardTitle>
            <CardDescription>Here is what the game is calculating while you focus on the board.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-8 text-sm sm:grid-cols-3 sm:p-8">
            <div className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm">
              <h3 className="mb-2 font-black">Clean round</h3>
              <p className="text-muted-foreground">You find the target in 4.20s with no wrong taps. Your round time is 4.20s.</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm">
              <h3 className="mb-2 font-black">Penalty round</h3>
              <p className="text-muted-foreground">You find it in 4.20s with one wrong tap and a 3s penalty. Final time: 7.20s.</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm">
              <h3 className="mb-2 font-black">Online room</h3>
              <p className="text-muted-foreground">Share the room link or QR code. Your friend joins, then you play the same challenge together.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="rounded-full"><Link href="/">Play Now</Link></Button>
          <Button asChild size="lg" variant="outline" className="rounded-full"><Link href="/online">Play with a Friend</Link></Button>
        </div>
      </section>
    </main>
  );
}
