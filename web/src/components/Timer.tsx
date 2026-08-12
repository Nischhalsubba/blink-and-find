import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface TimerProps {
  elapsedMs: number;
}

/**
 * Lightweight timer display.
 * The parent component controls the actual timer logic.
 */
export default function Timer({ elapsedMs }: TimerProps) {
  return (
    <Card className="glass-panel h-full rounded-[1.75rem] py-0 text-center">
      <CardContent className="flex h-full flex-col items-center justify-center p-3 sm:p-5">
        <Badge variant="outline" className="mb-2 rounded-full px-3 text-[11px] font-bold uppercase tracking-[0.16em] sm:text-xs">
          Time
        </Badge>

        <div className="text-2xl font-black tracking-[-0.06em] text-slate-950 sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
          {(elapsedMs / 1000).toFixed(2)}s
        </div>
        <p className="mt-1 text-[11px] font-medium text-muted-foreground sm:text-xs">Lower is better.</p>
      </CardContent>
    </Card>
  );
}
