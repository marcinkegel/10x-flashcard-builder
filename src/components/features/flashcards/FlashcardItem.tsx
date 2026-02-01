import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { FlashcardDTO } from "@/types";
import { EditFlashcardDialog } from "./EditFlashcardDialog";
import { DeleteFlashcardDialog } from "./DeleteFlashcardDialog";
import { cn } from "@/lib/utils";

interface FlashcardItemProps {
  flashcard: FlashcardDTO;
  onUpdate: (updated: FlashcardDTO) => void;
  onDelete: (id: string) => void;
  index?: number;
}

export function FlashcardItem({ flashcard, onUpdate, onDelete, index = 0 }: FlashcardItemProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <Card
        data-testid="flashcard-item"
        className={cn(
          "h-full flex flex-col group transition-all duration-200 hover:shadow-md border-2 border-transparent hover:border-primary/20",
          "animate-in fade-in zoom-in-95 duration-300 fill-mode-both"
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardContent className="pt-6 space-y-4 flex-grow">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-tight">Przód</h4>
            <p data-testid="flashcard-front-text" className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
              {flashcard.front}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-tight">Tył</h4>
            <p data-testid="flashcard-back-text" className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {flashcard.back}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 bg-muted/30 pt-4 pb-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Button
            data-testid="flashcard-edit-button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edytuj</span>
          </Button>
          <Button
            data-testid="flashcard-delete-button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Usuń</span>
          </Button>
        </CardFooter>
      </Card>

      <EditFlashcardDialog
        flashcard={flashcard}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={onUpdate}
      />

      <DeleteFlashcardDialog
        flashcardId={flashcard.id}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={() => onDelete(flashcard.id)}
      />
    </>
  );
}
