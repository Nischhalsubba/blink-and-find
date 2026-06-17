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
    <Card className="h-full gap-2 overflow-hidden py-3 text-center">
      <CardContent className="flex h-full flex-col items-center justify-center px-3">
        <Badge variant="outline" className="mb-2">
          Target
        </Badge>

        <div className={hidden ? "target-number target-hidden" : "target-number target-pulse"}>
          {hidden ? "?" : targetNumber ?? "-"}
        </div>
      </CardContent>
    </Card>
  );
}
