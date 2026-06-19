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
    description: "Split the board into left, middle, and right zones instead of letting your eyes bounce everywhere like a broken cursor.",
  },
  {
    title: "Slow down after a miss",
    description: "Wrong taps add time in most modes. A half-second pause is cheaper than panic-tapping three wrong numbers.",
  },
  {
    title: "Train on smaller boards",
    description: "Use Comfort or Practice mode first. Speed comes from pattern confidence, not from pretending thumbs are lasers.",
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
      <section className="mx-auto grid min-h-full w-full max-w-5xl gap-4 py-4">
        <Card className="overflow-hidden">
          <CardHeader className="border-b text-center">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit">Tips</Badge>
            <CardTitle className="text-4xl font-semibold tracking-tight sm:text-6xl">Get faster without flailing</CardTitle>
            <CardDescription>
              Blink & Find rewards memory, scanning, and calm hands. Wild tapping is just donating seconds to the void.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
            {tips.map((tip, index) => (
              <Card key={tip.title} className="bg-muted/20 shadow-none">
                <CardHeader>
                  <Badge variant="outline" className="w-fit">Tip {index + 1}</Badge>
                  <CardTitle className="text-xl">{tip.title}</CardTitle>
                  <CardDescription>{tip.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-end sm:p-6">
            <Button asChild variant="outline"><Link href="/practice">Practice</Link></Button>
            <Button asChild variant="outline"><Link href="/daily">Daily Challenge</Link></Button>
            <Button asChild><Link href="/time-attack">Time Attack</Link></Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
