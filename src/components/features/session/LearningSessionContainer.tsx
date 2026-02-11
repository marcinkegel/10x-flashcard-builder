import React, { useEffect, useState, useCallback } from "react";
import { useLearningSession } from "@/components/hooks/useLearningSession";
import { StudyCard } from "./StudyCard";
import { SessionHeader } from "./SessionHeader";
import { SessionControls } from "./SessionControls";
import { SessionSummary } from "./SessionSummary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCcw, Home, AlertCircle, PlusCircle } from "lucide-react";
import type { ApiResponse, PaginatedData, FlashcardDTO, SessionFlashcardVM } from "@/types";

// Helper to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const LearningSessionContainer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; type: "empty" | "error" } | null>(null);
  const [initialCards, setInitialCards] = useState<SessionFlashcardVM[]>([]);

  const { state, currentCard, isFinished, flipCard, handleKnown, handleRepeat, resetSession } =
    useLearningSession(initialCards);

  const fetchFlashcards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/flashcards?limit=12&sort=random");
      const result: ApiResponse<PaginatedData<FlashcardDTO>> = await response.json();

      if (result.success && result.data) {
        if (result.data.items.length === 0) {
          setError({
            message: "Brak fiszek w bibliotece. Dodaj kilka fiszek, aby rozpocząć naukę.",
            type: "empty",
          });
        } else {
          const mappedCards: SessionFlashcardVM[] = shuffleArray(result.data.items).map((card) => ({
            id: card.id,
            front: card.front,
            back: card.back,
            repeatCount: 0,
            wasAlwaysCorrect: true,
          }));
          setInitialCards(mappedCards);
          resetSession(mappedCards);
        }
      } else {
        setError({
          message: result.error?.message || "Nie udało się pobrać fiszek.",
          type: "error",
        });
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd podczas łączenia z API.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [resetSession]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || loading || error) return;

      if (e.code === "Space") {
        e.preventDefault();
        flipCard();
      } else if (state.isFlipped) {
        if (e.key === "1") {
          handleRepeat();
        } else if (e.key === "2") {
          handleKnown();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFinished, loading, error, state.isFlipped, flipCard, handleRepeat, handleKnown]);

  const handleExit = () => {
    window.location.href = "/flashcards";
  };

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full max-w-md mx-auto p-6 space-y-8 animate-pulse"
        data-testid="session-loading-skeleton"
      >
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-[450px] w-full rounded-2xl shadow-sm" />
        <div className="flex gap-4 w-full">
          <Skeleton className="h-16 flex-1 rounded-xl" />
          <Skeleton className="h-16 flex-1 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div
          className={
            error.type === "empty" ? "bg-primary/10 p-6 rounded-full mb-6" : "bg-destructive/10 p-6 rounded-full mb-6"
          }
        >
          {error.type === "empty" ? (
            <PlusCircle className="h-12 w-12 text-primary" />
          ) : (
            <AlertCircle className="h-12 w-12 text-destructive" />
          )}
        </div>

        <h2 className="text-2xl font-bold mb-3">
          {error.type === "empty" ? "Twoja biblioteka jest pusta" : "Wystąpił problem"}
        </h2>
        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">{error.message}</p>

        <div className="flex flex-col gap-3 w-full">
          {error.type === "empty" ? (
            <Button
              onClick={() => (window.location.href = "/generate")}
              className="w-full h-12 text-lg"
              data-testid="session-generate-first-button"
            >
              <PlusCircle className="mr-2 h-5 w-5" /> Generuj pierwsze fiszki
            </Button>
          ) : (
            <Button onClick={fetchFlashcards} className="w-full h-12 text-lg" data-testid="session-retry-button">
              <RotateCcw className="mr-2 h-5 w-5" /> Spróbuj ponownie
            </Button>
          )}
          <Button
            onClick={handleExit}
            variant="outline"
            className="w-full h-12 text-lg"
            data-testid="session-back-to-library-button"
          >
            <Home className="mr-2 h-5 w-5" /> Wróć do biblioteki
          </Button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return <SessionSummary stats={state.sessionStats} onRestart={fetchFlashcards} onExit={handleExit} />;
  }

  const progress = (state.completedCardsCount / state.totalInitialCards) * 100;

  const isRepeatPhase = state.completedCardsCount >= state.totalInitialCards;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <SessionHeader
        currentCount={state.completedCardsCount + 1}
        totalCount={state.totalInitialCards}
        isRepeatPhase={isRepeatPhase}
        onExit={handleExit}
      />

      {/* Progress Bar Container */}
      <div className="w-full h-1.5 bg-muted shrink-0 relative">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
          style={{ width: `${progress}%` }}
          data-testid="session-progress-bar"
        />
      </div>

      <main className="flex-1 flex flex-col items-center p-6 relative overflow-y-auto">
        {currentCard && (
          <div className="w-full max-w-md flex flex-col items-center space-y-6 sm:space-y-10 my-auto py-4 sm:py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <StudyCard
              front={currentCard.front}
              back={currentCard.back}
              isFlipped={state.isFlipped}
              onClick={flipCard}
            />

            <SessionControls
              isFlipped={state.isFlipped}
              onFlip={flipCard}
              onKnown={handleKnown}
              onRepeat={handleRepeat}
            />
          </div>
        )}
      </main>

      {/* Footer / Hint - Only visible on desktops */}
      <footer className="hidden md:flex items-center justify-center h-12 text-xs text-muted-foreground border-t bg-muted/30">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border bg-background shadow-sm">Spacja</kbd> Obróć
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border bg-background shadow-sm">1</kbd> Powtórz
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border bg-background shadow-sm">2</kbd> Znam
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LearningSessionContainer;
