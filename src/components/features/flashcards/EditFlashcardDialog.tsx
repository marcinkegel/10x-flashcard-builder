import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CharacterCounter } from "@/components/ui/character-counter";
import { toast } from "sonner";
import type { FlashcardDTO, UpdateFlashcardCommand, ApiResponse } from "@/types";

interface EditFlashcardDialogProps {
  flashcard: FlashcardDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: FlashcardDTO) => void;
}

export function EditFlashcardDialog({
  flashcard,
  isOpen,
  onClose,
  onSuccess,
}: EditFlashcardDialogProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});

  useEffect(() => {
    if (flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      setErrors({});
    }
  }, [flashcard, isOpen]);

  const validate = () => {
    const newErrors: { front?: string; back?: string } = {};
    if (!front.trim()) newErrors.front = "Pole przód nie może być puste.";
    if (front.length > 200) newErrors.front = "Maksymalnie 200 znaków.";
    if (!back.trim()) newErrors.back = "Pole tył nie może być puste.";
    if (back.length > 500) newErrors.back = "Maksymalnie 500 znaków.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!flashcard || !validate()) return;

    setIsSubmitting(true);
    try {
      // Determine source update: ai-full -> ai-edited if changed
      let newSource = flashcard.source;
      const contentChanged = front.trim() !== flashcard.front || back.trim() !== flashcard.back;
      
      if (flashcard.source === "ai-full" && contentChanged) {
        newSource = "ai-edited";
      }

      const command: UpdateFlashcardCommand = {
        front: front.trim(),
        back: back.trim(),
        source: newSource,
      };

      const response = await fetch(`/api/flashcards/${flashcard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      const result: ApiResponse<FlashcardDTO> = await response.json();

      if (result.success && result.data) {
        toast.success("Fiszka została zaktualizowana.");
        onSuccess(result.data);
        onClose();
      } else {
        toast.error(result.error?.message || "Nie udało się zaktualizować fiszki.");
      }
    } catch (error) {
      console.error("Error updating flashcard:", error);
      toast.error("Wystąpił nieoczekiwany błąd.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = flashcard && (front.trim() !== flashcard.front || back.trim() !== flashcard.back);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>
            Wprowadź zmiany w treści fiszki. Zmiany zostaną zapisane natychmiast po zatwierdzeniu.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="front">Przód (Pytanie)</Label>
              <CharacterCounter current={front.length} max={200} />
            </div>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className={errors.front ? "border-destructive" : ""}
              rows={3}
            />
            {errors.front && <p className="text-xs text-destructive">{errors.front}</p>}
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="back">Tył (Odpowiedź)</Label>
              <CharacterCounter current={back.length} max={500} />
            </div>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className={errors.back ? "border-destructive" : ""}
              rows={4}
            />
            {errors.back && <p className="text-xs text-destructive">{errors.back}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Anuluj
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !hasChanges}
          >
            {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
