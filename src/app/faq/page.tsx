import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const description = "Read answers to common Blink & Find questions about scoring, wrong taps, saved stats, Daily Challenge, online rooms, and game modes.";

const faqs = [
  {
    question: "How do you play Blink & Find?",
    answer: "Memorize the target number, wait for it to hide, then tap the matching number on the scattered board.",
  },
  {
    question: "How is the score calculated?",
    answer: "Your final time is your raw find time plus penalty time from wrong taps. Lower total time wins.",
  },
  {
    question: "Do wrong taps matter in every mode?",
    answer: "Most competitive modes track or penalize wrong taps. Practice and Zen are softer so players can learn without pressure.",
  },
  {
    question: "What is Daily Challenge?",
    answer: "Daily Challenge gives everyone the same seeded board and target for the day, making comparisons fair.",
  },
  {
    question: "What is Same Challenge online mode?",
    answer: "Players take turns on the same board and target. Results are compared after everyone finishes.",
  },
  {
    question: "What is Live Race online mode?",
    answer: "Players race simultaneously on the same board after a shared countdown.",
  },
  {
    question: "Are stats saved to an account?",
    answer: "Current personal stats are saved locally in your browser. No login is required.",
  },
  {
    question: "Can I share a challenge?",
    answer: "Yes. Challenge links use a seed so another player can open the exact same board and target.",
  },
];

export const metadata: Metadata = {
  title: "FAQ | Blink & Find",
  description,
  alternates: {
    canonical: absoluteUrl("/faq"),
  },
  openGraph: {
    title: "Blink & Find FAQ",
    description,
    url: absoluteUrl("/faq"),
    siteName: SITE_NAME,
    type: "article",
  },
};

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="app-shell overflow-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="mx-auto grid min-h-full w-full max-w-5xl gap-4 py-4">
        <Card className="overflow-hidden">
          <CardHeader className="border-b text-center">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit">FAQ</Badge>
            <CardTitle className="text-4xl font-semibold tracking-tight sm:text-6xl">Questions, answered</CardTitle>
            <CardDescription>
              The game is simple. The internet still requires an FAQ. Civilization marches on, somehow.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 sm:p-6">
            {faqs.map((item) => (
              <details key={item.question} className="rounded-xl border bg-muted/20 p-4">
                <summary className="cursor-pointer font-semibold">{item.question}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-end sm:p-6">
            <Button asChild variant="outline"><Link href="/rules">Rules</Link></Button>
            <Button asChild variant="outline"><Link href="/modes">Modes</Link></Button>
            <Button asChild><Link href="/">Play Now</Link></Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
