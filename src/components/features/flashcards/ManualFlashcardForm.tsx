import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CharacterCounter } from "@/components/ui/character-counter";
import { toast } from "sonner";
import type { CreateFlashcardCommand, ApiResponse, FlashcardDTO } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Form for manual flashcard creation.
 */
export function ManualFlashcardForm() {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isTouchedFront, setIsTouchedFront] = useState(false);
  const [isTouchedBack, setIsTouchedBack] = useState(false);

  const errorRef = useRef<HTMLDivElement>(null);

  const FRONT_MAX = 200;
  const BACK_MAX = 500;

  const isFrontInvalid = front.trim().length === 0 || front.length > FRONT_MAX;
  const isBackInvalid = back.trim().length === 0 || back.length > BACK_MAX;

  const shouldShowFrontError = (isTouchedFront || front.length > FRONT_MAX) && isFrontInvalid;
  const shouldShowBackError = (isTouchedBack || back.length > BACK_MAX) && isBackInvalid;

  const canSave = !isFrontInvalid && !isBackInvalid && !isSaving;

  const hasError = !!error;
  // Scroll to error when any error becomes visible
  useEffect(() => {
    if ((shouldShowFrontError || shouldShowBackError || hasError) && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [shouldShowFrontError, shouldShowBackError, hasError]);

  const handleSave = async () => {
    if (!canSave) {
      setIsTouchedFront(true);
      setIsTouchedBack(true);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const command: CreateFlashcardCommand = {
        front: front.trim(),
        back: back.trim(),
        source: "manual",
      };

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      const result: ApiResponse<FlashcardDTO[]> = await response.json();

      if (result.success) {
        toast.success("Fiszka została utworzona pomyślnie!");
        setFront("");
        setBack("");
        setIsTouchedFront(false);
        setIsTouchedBack(false);
      } else {
        setError(result.error?.message || "Błąd podczas tworzenia fiszki.");
      }
    } catch {
      setError("Wystąpił błąd sieciowy.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="front">Przód fiszki (Pytanie/Pojęcie)</Label>
        <Textarea
          id="front"
          data-testid="manual-front-input"
          placeholder="Np. Czym jest React?"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          onBlur={() => setIsTouchedFront(true)}
          className={cn(
            "min-h-[100px] resize-none transition-colors",
            shouldShowFrontError && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <CharacterCounter current={front.length} max={FRONT_MAX} />
        {shouldShowFrontError && (
          <p className="text-xs font-semibold text-destructive animate-in fade-in slide-in-from-top-1">
            {front.trim().length === 0 ? "To pole nie może być puste." : "Przekroczono limit znaków."}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="back">Tył fiszki (Odpowiedź/Definicja)</Label>
        <Textarea
          id="back"
          data-testid="manual-back-input"
          placeholder="Np. Biblioteka JavaScript do budowy interfejsów użytkownika."
          value={back}
          onChange={(e) => setBack(e.target.value)}
          onBlur={() => setIsTouchedBack(true)}
          className={cn(
            "min-h-[150px] resize-none transition-colors",
            shouldShowBackError && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <CharacterCounter current={back.length} max={BACK_MAX} />
        {shouldShowBackError && (
          <p className="text-xs font-semibold text-destructive animate-in fade-in slide-in-from-top-1">
            {back.trim().length === 0 ? "To pole nie może być puste." : "Przekroczono limit znaków."}
          </p>
        )}
      </div>

      <div ref={errorRef} className="space-y-2">
        {error && (
          <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          data-testid="manual-submit-button"
          disabled={!canSave && (isTouchedFront || isTouchedBack)}
          className="w-full md:w-auto"
        >
          {isSaving ? "Zapisywanie..." : "Dodaj fiszkę"}
        </Button>
      </div>
    </div>
  );
}
