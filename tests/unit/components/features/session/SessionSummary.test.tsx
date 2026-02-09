import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SessionSummary } from "@/components/features/session/SessionSummary";

describe("SessionSummary", () => {
  const mockStats = {
    totalCards: 10,
    firstTimeCorrect: 8,
    totalRepeats: 5,
  };

  const defaultProps = {
    stats: mockStats,
    onRestart: vi.fn(),
    onExit: vi.fn(),
  };

  it("should calculate and display correct accuracy percentage (T-UNI-06)", () => {
    render(<SessionSummary {...defaultProps} />);

    // 8 / 10 = 80%
    expect(screen.getByText("80%")).toBeDefined();
    expect(screen.getByText("Bez powtórzeń")).toBeDefined();
  });

  it("should display total cards count (T-UNI-06)", () => {
    render(<SessionSummary {...defaultProps} />);

    expect(screen.getByText("10")).toBeDefined();
    expect(screen.getByText("Fiszki")).toBeDefined();
  });

  it("should display total repeats count (T-UNI-06)", () => {
    render(<SessionSummary {...defaultProps} />);

    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText(/Tyle razy powtórzyłeś karty/)).toBeDefined();
  });

  it("should call onRestart when 'Nowa sesja' button is clicked", () => {
    render(<SessionSummary {...defaultProps} />);

    fireEvent.click(screen.getByText("Nowa sesja"));
    expect(defaultProps.onRestart).toHaveBeenCalled();
  });

  it("should call onExit when 'Wróć do biblioteki' button is clicked", () => {
    render(<SessionSummary {...defaultProps} />);

    fireEvent.click(screen.getByText("Wróć do biblioteki"));
    expect(defaultProps.onExit).toHaveBeenCalled();
  });

  it("should handle 0 total cards without crashing", () => {
    render(<SessionSummary {...defaultProps} stats={{ totalCards: 0, firstTimeCorrect: 0, totalRepeats: 0 }} />);

    expect(screen.getByText("0%")).toBeDefined();
  });
});
