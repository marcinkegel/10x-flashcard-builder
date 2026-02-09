import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLearningSession } from "@/components/hooks/useLearningSession";
import type { SessionFlashcardVM } from "@/types";

const mockFlashcards: SessionFlashcardVM[] = [
  { id: "1", front: "Front 1", back: "Back 1", repeatCount: 0, wasAlwaysCorrect: true },
  { id: "2", front: "Front 2", back: "Back 2", repeatCount: 0, wasAlwaysCorrect: true },
];

describe("useLearningSession", () => {
  it("should initialize with correct initial state (T-UNI-01)", () => {
    const { result } = renderHook(() => useLearningSession(mockFlashcards));

    expect(result.current.state.queue).toEqual(mockFlashcards);
    expect(result.current.state.completedCardsCount).toBe(0);
    expect(result.current.state.isFlipped).toBe(false);
    expect(result.current.state.totalInitialCards).toBe(2);
    expect(result.current.currentCard).toEqual(mockFlashcards[0]);
    expect(result.current.isFinished).toBe(false);
  });

  it("should handle handleKnown action correctly (T-UNI-02)", () => {
    const { result } = renderHook(() => useLearningSession(mockFlashcards));

    act(() => {
      result.current.handleKnown();
    });

    expect(result.current.state.queue).toHaveLength(1);
    expect(result.current.state.queue[0].id).toBe("2");
    expect(result.current.state.completedCardsCount).toBe(1);
    expect(result.current.state.sessionStats.firstTimeCorrect).toBe(1);
    expect(result.current.state.isFlipped).toBe(false);
  });

  it("should handle handleRepeat action correctly (T-UNI-03)", () => {
    const { result } = renderHook(() => useLearningSession(mockFlashcards));

    act(() => {
      result.current.handleRepeat();
    });

    expect(result.current.state.queue).toHaveLength(2);
    expect(result.current.state.queue[1].id).toBe("1");
    expect(result.current.state.queue[1].repeatCount).toBe(1);
    expect(result.current.state.queue[1].wasAlwaysCorrect).toBe(false);
    expect(result.current.state.completedCardsCount).toBe(0);
    expect(result.current.state.sessionStats.totalRepeats).toBe(1);
    expect(result.current.state.isFlipped).toBe(false);
  });

  it("should handle flipCard action correctly", () => {
    const { result } = renderHook(() => useLearningSession(mockFlashcards));

    act(() => {
      result.current.flipCard();
    });

    expect(result.current.state.isFlipped).toBe(true);

    act(() => {
      result.current.flipCard();
    });

    expect(result.current.state.isFlipped).toBe(false);
  });

  it("should mark session as finished when queue is empty", () => {
    const { result } = renderHook(() => useLearningSession([mockFlashcards[0]]));

    act(() => {
      result.current.handleKnown();
    });

    expect(result.current.state.queue).toHaveLength(0);
    expect(result.current.isFinished).toBe(true);
  });

  it("should reset session with new cards", () => {
    const { result } = renderHook(() => useLearningSession(mockFlashcards));
    const newCards: SessionFlashcardVM[] = [
      { id: "3", front: "Front 3", back: "Back 3", repeatCount: 0, wasAlwaysCorrect: true },
    ];

    act(() => {
      result.current.resetSession(newCards);
    });

    expect(result.current.state.queue).toEqual(newCards);
    expect(result.current.state.totalInitialCards).toBe(1);
    expect(result.current.state.completedCardsCount).toBe(0);
  });
});
