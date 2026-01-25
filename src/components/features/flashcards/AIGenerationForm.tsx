import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CharacterCounter } from "@/components/ui/character-counter";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIGenerationFormProps {
  onGenerate: (text: string) => Promise<{ success: boolean; error?: string }>;
  isGenerating: boolean;
  hasActiveProposals: boolean;
}

/**
 * Form to input source text for AI flashcard generation.
 */
export function AIGenerationForm({ onGenerate, isGenerating, hasActiveProposals }: AIGenerationFormProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const MIN_CHARS = 1000;
  const MAX_CHARS = 10000;

  const isTooShort = text.length > 0 && text.length < MIN_CHARS;
  const isTooLong = text.length > MAX_CHARS;
  const isInvalidLength = isTooShort || isTooLong;

  // Wiadomość i czerwona ramka powinny pojawiać się dopiero po przekroczeniu ilości znaków lub po wyjściu z ramki
  const shouldShowValidationError = (isTouched || text.length > MAX_CHARS) && isInvalidLength;

  const canGenerate = text.length >= MIN_CHARS && text.length <= MAX_CHARS && !isGenerating && !hasActiveProposals;

  const hasError = !!error;
  // Scroll to error when it appears
  useEffect(() => {
    if ((shouldShowValidationError || hasError) && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [shouldShowValidationError, hasError]);

  const handleGenerate = async () => {
    if (hasActiveProposals) return;

    if (!canGenerate) {
      setIsTouched(true);
      return;
    }
    setError(null);
    const result = await onGenerate(text);
    if (!result.success) {
      setError(result.error || "Wystąpił nieoczekiwany błąd.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="source-text">Wklej tekst źródłowy (artykuł, notatki, rozdział książki)</Label>
        <Textarea
          id="source-text"
          placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki (minimum 1000 znaków)..."
          className={cn(
            "min-h-[200px] max-h-[400px] overflow-y-auto resize-y transition-colors",
            shouldShowValidationError && "border-destructive focus-visible:ring-destructive"
          )}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => setIsTouched(true)}
          disabled={isGenerating || hasActiveProposals}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Zalecamy teksty o spójnej tematyce dla najlepszych efektów.</p>
          <CharacterCounter current={text.length} min={MIN_CHARS} max={MAX_CHARS} />
        </div>

        {/* Informacje o błędach i nieodpowiedniej ilości tekstu poniżej licznika znaków ale nad przyciskiem */}
        <div ref={errorRef} className="space-y-2">
          {hasActiveProposals && (
            <div className="p-3 text-sm font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-md animate-in fade-in slide-in-from-top-1">
              Aby wygenerować kolejne propozycje, najpierw zapisz lub usuń wszystkie propozycje z poprzedniej sesji.
            </div>
          )}

          {shouldShowValidationError && (
            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md animate-in fade-in slide-in-from-top-1">
              {isTooShort && `Tekst jest za krótki. Brakuje jeszcze ${MIN_CHARS - text.length} znaków.`}
              {isTooLong && `Tekst jest za długi. Przekroczono limit o ${text.length - MAX_CHARS} znaków.`}
            </div>
          )}

          {error && (
            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}
        </div>
      </div>

      <Button className="w-full h-12 text-base font-semibold" disabled={!canGenerate} onClick={handleGenerate}>
        {isGenerating ? (
          <>Generowanie...</>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Generuj fiszki AI
          </>
        )}
      </Button>
    </div>
  );
}
