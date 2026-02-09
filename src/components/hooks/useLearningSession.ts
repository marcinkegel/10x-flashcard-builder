import { useState, useCallback, useMemo } from "react";
import type { SessionFlashcardVM, SessionStateVM } from "@/types";

export const useLearningSession = (initialFlashcards: SessionFlashcardVM[]) => {
  const [state, setState] = useState<SessionStateVM>({
    queue: [...initialFlashcards],
    currentIndex: 0,
    isFlipped: false,
    completedCardsCount: 0,
    totalInitialCards: initialFlashcards.length,
    sessionStats: {
      totalCards: initialFlashcards.length,
      firstTimeCorrect: 0,
      totalRepeats: 0,
    },
  });

  const currentCard = useMemo(() => state.queue[0] || null, [state.queue]);
  const isFinished = state.queue.length === 0 && state.totalInitialCards > 0;

  const flipCard = useCallback(() => {
    setState((prev) => ({ ...prev, isFlipped: !prev.isFlipped }));
  }, []);

  const handleKnown = useCallback(() => {
    if (!currentCard) return;

    setState((prev) => {
      const isFirstAttempt = currentCard.repeatCount === 0;
      const newQueue = prev.queue.slice(1);

      return {
        ...prev,
        queue: newQueue,
        isFlipped: false,
        completedCardsCount: prev.completedCardsCount + 1,
        sessionStats: {
          ...prev.sessionStats,
          firstTimeCorrect: isFirstAttempt
            ? prev.sessionStats.firstTimeCorrect + 1
            : prev.sessionStats.firstTimeCorrect,
        },
      };
    });
  }, [currentCard]);

  const handleRepeat = useCallback(() => {
    if (!currentCard) return;

    setState((prev) => {
      const updatedCard: SessionFlashcardVM = {
        ...currentCard,
        repeatCount: currentCard.repeatCount + 1,
        wasAlwaysCorrect: false,
      };

      // Move to the end of the queue
      const newQueue = [...prev.queue.slice(1), updatedCard];

      return {
        ...prev,
        queue: newQueue,
        isFlipped: false,
        sessionStats: {
          ...prev.sessionStats,
          totalRepeats: prev.sessionStats.totalRepeats + 1,
        },
      };
    });
  }, [currentCard]);

  const resetSession = useCallback((newFlashcards: SessionFlashcardVM[]) => {
    setState({
      queue: [...newFlashcards],
      currentIndex: 0,
      isFlipped: false,
      completedCardsCount: 0,
      totalInitialCards: newFlashcards.length,
      sessionStats: {
        totalCards: newFlashcards.length,
        firstTimeCorrect: 0,
        totalRepeats: 0,
      },
    });
  }, []);

  return {
    state,
    currentCard,
    isFinished,
    flipCard,
    handleKnown,
    handleRepeat,
    resetSession,
  };
};
