import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudyCard } from "@/components/features/session/StudyCard";

describe("StudyCard", () => {
  const onClick = vi.fn();
  const defaultProps = {
    front: "Front content",
    back: "Back content",
    isFlipped: false,
    onClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render front content when not flipped (T-UNI-04)", () => {
    render(<StudyCard {...defaultProps} />);

    expect(screen.getByText("Front content")).toBeDefined();
    expect(screen.queryByText("Back content")).toBeDefined(); // Both are rendered but hidden by CSS (backface-hidden)

    // In jsdom we can't easily check visibility based on CSS classes like backface-hidden,
    // but we can check if the correct side has the rotate-y-180 class via the container.
    const flipContainer = screen.getByRole("button").firstChild;
    expect(flipContainer).not.toHaveClass("rotate-y-180");
  });

  it("should render back content when flipped (T-UNI-04)", () => {
    render(<StudyCard {...defaultProps} isFlipped={true} />);

    const flipContainer = screen.getByRole("button").firstChild;
    expect(flipContainer).toHaveClass("rotate-y-180");
  });

  it("should call onClick when clicked (T-UNI-04)", () => {
    render(<StudyCard {...defaultProps} />);

    fireEvent.click(screen.getByRole("button"));
    expect(defaultProps.onClick).toHaveBeenCalled();
  });

  it("should call onClick when Space or Enter key is pressed", () => {
    render(<StudyCard {...defaultProps} />);

    const card = screen.getByRole("button");

    fireEvent.keyDown(card, { key: " " });
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: "Enter" });
    expect(defaultProps.onClick).toHaveBeenCalledTimes(2);
  });
});
