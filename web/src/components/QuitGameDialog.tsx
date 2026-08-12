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
  triggerLabel?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
}

/**
 * Confirmation dialog for leaving an active game.
 */
export default function QuitGameDialog({
  onConfirm,
  triggerLabel = "Back to Setup",
  title = "Leave this game?",
  description = "Current round progress will be lost. Saved best scores and settings stay on this device.",
  confirmLabel = "Leave Game",
}: QuitGameDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="h-12 rounded-2xl font-bold">
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
