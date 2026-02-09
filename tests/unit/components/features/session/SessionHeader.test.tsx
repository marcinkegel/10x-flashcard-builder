import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SessionHeader } from "@/components/features/session/SessionHeader";

describe("SessionHeader", () => {
  const defaultProps = {
    currentCount: 1,
    totalCount: 10,
    isRepeatPhase: false,
    onExit: vi.fn(),
  };

  it("should display correct card progress in normal phase (T-UNI-05)", () => {
    render(<SessionHeader {...defaultProps} />);

    expect(screen.getByText(/Karta/i)).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText(/z/i)).toBeDefined();
    expect(screen.getByText("10")).toBeDefined();
    expect(screen.queryByText("Powtórka kart")).toBeNull();
  });

  it("should display 'Powtórka kart' in repeat phase (T-UNI-05)", () => {
    render(<SessionHeader {...defaultProps} isRepeatPhase={true} />);

    expect(screen.getByText("Powtórka kart")).toBeDefined();
    expect(screen.queryByText("Karta")).toBeNull();
  });

  it("should call onExit when exit button is clicked", () => {
    render(<SessionHeader {...defaultProps} />);

    fireEvent.click(screen.getByText("Wyjdź"));
    expect(defaultProps.onExit).toHaveBeenCalled();
  });
});
