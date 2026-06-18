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
export default function TargetDisplay({
  targetNumber,
  hidden = false,
}: TargetDisplayProps) {
  return (
    <Card className="h-full gap-1 overflow-hidden py-2 text-center sm:gap-2 sm:py-3">
      <CardContent className="flex h-full flex-col items-center justify-center px-2 sm:px-3">
        <Badge variant="outline" className="mb-1 text-[11px] sm:mb-2 sm:text-xs">
          Target
        </Badge>

        <div className={hidden ? "target-number target-hidden" : "target-number target-pulse"}>
          {hidden ? "?" : targetNumber ?? "-"}
        </div>
      </CardContent>
    </Card>
  );
}
