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
    <Card className="h-full gap-1 py-2 text-center sm:gap-2 sm:py-3">
      <CardContent className="flex h-full flex-col items-center justify-center px-2 sm:px-3">
        <Badge variant="outline" className="mb-1 text-[11px] sm:mb-2 sm:text-xs">
          Timer
        </Badge>

        <div className="text-xl font-bold tracking-tight sm:text-3xl">
          {(elapsedMs / 1000).toFixed(2)}s
        </div>
      </CardContent>
    </Card>
  );
}
