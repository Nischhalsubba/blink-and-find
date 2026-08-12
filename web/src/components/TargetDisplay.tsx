import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface TargetDisplayProps {
  targetNumber: number | null;
  hidden?: boolean;
}

/**
 * Displays the currently flashed target number.
 * When hidden, the player must remember what blinked before the timer started.
 */
export default function TargetDisplay({ targetNumber, hidden = false }: TargetDisplayProps) {
  return (
    <Card className="glass-panel h-full overflow-hidden rounded-[1.75rem] py-0 text-center">
      <CardContent className="flex h-full flex-col items-center justify-center p-3 sm:p-5">
        <Badge variant="outline" className="mb-2 rounded-full px-3 text-[11px] font-bold uppercase tracking-[0.16em] sm:text-xs">
          Target
        </Badge>

        <div className={hidden ? "target-number target-hidden" : "target-number target-pulse"}>
          {hidden ? "?" : targetNumber ?? "-"}
        </div>
        <p className="mt-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
          {hidden ? "Recall it, then scan." : "Memorize this number."}
        </p>
      </CardContent>
    </Card>
  );
}
