import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import type { ApiResponse } from "@/types";

interface DeleteFlashcardDialogProps {
  flashcardId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteFlashcardDialog({ flashcardId, isOpen, onClose, onSuccess }: DeleteFlashcardDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!flashcardId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/flashcards/${flashcardId}`, {
        method: "DELETE",
      });

      const result: ApiResponse<void> = await response.json();

      if (result.success) {
        toast.success("Fiszka została usunięta.");
        onSuccess();
        onClose();
      } else {
        toast.error(result.error?.message || "Nie udało się usunąć fiszki.");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting flashcard:", error);
      toast.error("Wystąpił nieoczekiwany błąd.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć tę fiszkę?</AlertDialogTitle>
          <AlertDialogDescription>
            Tej operacji nie można cofnąć. Fiszka zostanie trwale usunięta z Twojej biblioteki.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? "Usuwanie..." : "Usuń fiszkę"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
