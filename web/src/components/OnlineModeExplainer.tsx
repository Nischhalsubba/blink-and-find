"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OnlineGameType } from "@/types/online";

interface OnlineModeExplainerProps {
  value: OnlineGameType;
  onChange: (value: OnlineGameType) => void;
}

const modes = [
  {
    id: "same_challenge" as const,
    title: "Same Challenge",
    badge: "Recommended",
    description: "Players take turns on the same board and target. Best for steady play and fair comparisons.",
  },
  {
    id: "live_race" as const,
    title: "Live Race",
    badge: "Fast",
    description: "Everyone races at the same time after a shared countdown. Best when both players are ready.",
  },
];

export default function OnlineModeExplainer({ value, onChange }: OnlineModeExplainerProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {modes.map((mode) => (
        <button key={mode.id} type="button" onClick={() => onChange(mode.id)} className="text-left">
          <Card className={cn(
            "h-full bg-muted/20 shadow-none transition-all hover:border-primary/60",
            value === mode.id && "border-primary bg-primary/5"
          )}>
            <CardHeader className="space-y-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{mode.title}</CardTitle>
                <Badge variant={value === mode.id ? "default" : "outline"}>{mode.badge}</Badge>
              </div>
              <CardDescription>{mode.description}</CardDescription>
            </CardHeader>
          </Card>
        </button>
      ))}
    </div>
  );
}
