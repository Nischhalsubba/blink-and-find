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
    <Card className="h-full gap-2 py-3 text-center">
      <CardContent className="flex h-full flex-col items-center justify-center px-3">
        <Badge variant="outline" className="mb-2">
          Timer
        </Badge>

        <div className="text-2xl font-bold tracking-tight sm:text-3xl">
          {(elapsedMs / 1000).toFixed(2)}s
        </div>
      </CardContent>
    </Card>
  );
}
