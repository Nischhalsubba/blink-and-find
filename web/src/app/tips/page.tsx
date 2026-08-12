import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Improve at Blink & Find with practical scanning, memory, focus, and speed tips for number hunting games.";

const tips = [
  {
    title: "Say the target once",
    description: "Quietly repeat the target before it hides. One clean mental label beats frantic re-checking.",
  },
  {
    title: "Scan in zones",
    description: "Split the board into left, middle, and right zones instead of letting your eyes bounce everywhere.",
  },
  {
    title: "Slow down after a miss",
    description: "Wrong taps add time in most modes. A half-second pause is cheaper than panic-tapping three wrong numbers.",
  },
  {
    title: "Train on smaller boards",
    description: "Use Comfort or Practice mode first. Speed comes from pattern confidence.",
  },
  {
    title: "Use Daily Challenge for consistency",
    description: "One fair board per day gives you a simple routine and a cleaner way to compare progress.",
  },
  {
    title: "Use Time Attack for speed",
    description: "Sprint mode builds quick recognition, but only after you can keep accuracy under control.",
  },
];

export const metadata: Metadata = {
  title: "Tips | Get Faster at Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/tips"),
  },
  openGraph: {
    title: "Blink & Find Tips",
    description,
    url: absoluteUrl("/tips"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function TipsPage() {
  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto grid min-h-full w-full max-w-5xl gap-5 py-4">
        <Card className="overflow-hidden border-white/70 bg-white/85 shadow-xl shadow-amber-950/5 backdrop-blur">
          <CardHeader className="border-b border-amber-100 p-6 text-center sm:p-8">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit rounded-full">Tips</Badge>
            <CardTitle className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">Get faster without flailing</CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-base leading-7">
              Blink & Find rewards memory, scanning, and calm hands. Clean focus beats frantic tapping.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-8 sm:grid-cols-2 sm:p-8">
            {tips.map((tip, index) => (
              <Card key={tip.title} className="rounded-3xl border-white/70 bg-white/70 shadow-none">
                <CardHeader>
                  <Badge variant="outline" className="w-fit rounded-full">Tip {index + 1}</Badge>
                  <CardTitle className="text-xl font-black">{tip.title}</CardTitle>
                  <CardDescription>{tip.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t border-amber-100 p-4 pt-6 sm:flex-row sm:justify-end sm:p-6">
            <Button asChild variant="outline" className="rounded-full"><Link href="/practice">Practice</Link></Button>
            <Button asChild variant="outline" className="rounded-full"><Link href="/daily">Daily Challenge</Link></Button>
            <Button asChild className="rounded-full"><Link href="/time-attack">Time Attack</Link></Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
