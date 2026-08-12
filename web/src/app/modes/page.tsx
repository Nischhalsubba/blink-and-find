import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Explore Blink & Find modes grouped by play style: quick play, focus training, creative challenges, party modes, and online play.";

type Mode = {
  href: string;
  title: string;
  tag: string;
  description: string;
  action: string;
  status?: "ready" | "new" | "experimental";
};

type ModeGroup = {
  title: string;
  mood: string;
  description: string;
  modes: Mode[];
};

const modeGroups: ModeGroup[] = [
  {
    title: "Start Here",
    mood: "simple",
    description: "For first plays, warmups, and people who do not want the game to attack them immediately.",
    modes: [
      { href: "/", title: "Classic Match", tag: "Core", description: "Customize board size, required numbers, timers, and play solo or same-device.", action: "Customize", status: "ready" },
      { href: "/practice", title: "Practice Lab", tag: "Learn", description: "Replay the core loop and build scanning confidence without making it dramatic.", action: "Practice", status: "ready" },
      { href: "/comfort", title: "Comfort Mode", tag: "Gentle", description: "Bigger tiles, slower preview, lower pressure, and friendlier pacing.", action: "Relax", status: "ready" },
    ],
  },
  {
    title: "Creative Challenges",
    mood: "weird but useful",
    description: "New concepts built around memory tricks, pattern disruption, and tiny chaos machines.",
    modes: [
      { href: "/?mode=mystery", title: "Mystery Board", tag: "New", description: "The target appears, but the board order changes every round with your required numbers preserved.", action: "Try setup", status: "new" },
      { href: "/?mode=number-hunt", title: "Number Hunt", tag: "New", description: "Enter your own number set, then hunt them across randomized boards like a tiny numerical detective.", action: "Build hunt", status: "new" },
      { href: "/?mode=memory-ladder", title: "Memory Ladder", tag: "New", description: "Start easy, then increase slots and pressure each round. The game politely becomes less polite.", action: "Climb", status: "experimental" },
      { href: "/?mode=chaos-grid", title: "Chaos Grid", tag: "New", description: "A fast board with custom numbers, random fillers, and a more aggressive reshuffle rhythm.", action: "Enter chaos", status: "experimental" },
      { href: "/zen", title: "Zen Garden", tag: "Calm", description: "Endless no-pressure play for repetition, focus, and the rare human desire to relax.", action: "Play zen", status: "ready" },
      { href: "/daily", title: "Daily Puzzle", tag: "Habit", description: "One shared daily challenge so everyone can compare the same puzzle.", action: "Today", status: "ready" },
    ],
  },
  {
    title: "Speed & Precision",
    mood: "competitive",
    description: "For players who think calm is suspicious and want proof they are faster than a grid.",
    modes: [
      { href: "/time-attack", title: "Time Attack", tag: "Speed", description: "A 60-second sprint to find as many targets as possible.", action: "Sprint", status: "ready" },
      { href: "/streak", title: "Streak Run", tag: "Precision", description: "Keep a clean chain going. One wrong tap ends the run, because mercy left early.", action: "Build streak", status: "ready" },
      { href: "/leaderboard", title: "Leaderboard", tag: "Scores", description: "Compare saved runs and see which version of you was less embarrassing.", action: "View scores", status: "ready" },
    ],
  },
  {
    title: "Social & Online",
    mood: "with humans",
    description: "Play beside someone, send a link, or invite someone who is online right now.",
    modes: [
      { href: "/online", title: "Play Online Now", tag: "Simple", description: "See available players, invite one, accept, and start. Three buttons. Society heals.", action: "Online", status: "new" },
      { href: "/challenge", title: "Challenge Link", tag: "Share", description: "Send a fixed seeded board so friends play the exact same challenge.", action: "Make link", status: "ready" },
      { href: "/", title: "Same-Device Party", tag: "Local", description: "Pass one device around and compare rounds without accounts, rooms, or digital paperwork.", action: "Set up", status: "ready" },
    ],
  },
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

function statusLabel(status: Mode["status"]) {
  if (status === "new") {
    return "New";
  }

  if (status === "experimental") {
    return "Experimental";
  }

  return "Ready";
}

export default function ModesPage() {
  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto grid min-h-full w-full max-w-7xl gap-5 px-3 py-4 sm:px-6">
        <Card className="overflow-hidden rounded-[2rem] border-white/70 bg-white/85 shadow-xl shadow-amber-950/5 backdrop-blur">
          <CardHeader className="border-b border-amber-100 p-6 text-center sm:p-10">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit rounded-full">Arcade Menu</Badge>
            <CardTitle className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">Choose the kind of brain trouble you want</CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-base leading-7">
              Modes are now grouped by intent: learn, get creative, chase speed, or play with other people, because apparently humans enjoy categories.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6 p-4 sm:p-8">
            {modeGroups.map((group) => (
              <section key={group.title} className="grid gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2 w-fit rounded-full">{group.mood}</Badge>
                    <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">{group.title}</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{group.description}</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {group.modes.map((mode) => (
                    <Card key={`${group.title}-${mode.title}`} className="rounded-3xl border-white/70 bg-white/75 shadow-none transition hover:-translate-y-0.5 hover:shadow-lg">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="w-fit rounded-full">{mode.tag}</Badge>
                          <Badge variant={mode.status === "new" ? "secondary" : "outline"} className="w-fit rounded-full">{statusLabel(mode.status)}</Badge>
                        </div>
                        <CardTitle className="text-xl font-black">{mode.title}</CardTitle>
                        <CardDescription>{mode.description}</CardDescription>
                      </CardHeader>
                      <CardFooter>
                        <Button asChild variant={mode.status === "new" ? "default" : "outline"} className="w-full rounded-full">
                          <Link href={mode.href}>{mode.action}</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t border-amber-100 p-4 pt-6 sm:flex-row sm:justify-end sm:p-6">
            <Button asChild variant="outline" className="rounded-full"><Link href="/tips">Tips</Link></Button>
            <Button asChild className="rounded-full"><Link href="/">Customize Match</Link></Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
