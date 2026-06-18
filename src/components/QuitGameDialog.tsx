import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface QuitGameDialogProps {
  onConfirm: () => void;
}

/**
 * Confirmation dialog for leaving an active game.
 */
export default function QuitGameDialog({ onConfirm }: QuitGameDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 min-w-0 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm">
          <span className="sm:hidden">Back</span>
          <span className="hidden sm:inline">Back to Setup</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave this game?</AlertDialogTitle>
          <AlertDialogDescription>
            Current round progress will be lost. Saved best scores and settings stay on this device.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Leave Game</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
