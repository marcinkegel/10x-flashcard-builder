import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIGenerationForm } from "@/components/features/flashcards/AIGenerationForm";

describe("AIGenerationForm", () => {
  const mockOnGenerate = vi.fn().mockResolvedValue({ success: true });

  beforeEach(() => {
    mockOnGenerate.mockReset();
    mockOnGenerate.mockResolvedValue({ success: true });
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("przycisk generowania jest zablokowany, gdy tekst jest za krótki", () => {
    render(<AIGenerationForm onGenerate={mockOnGenerate} isGenerating={false} hasActiveProposals={false} />);
    
    const input = screen.getByLabelText(/Wklej tekst źródłowy/i);
    fireEvent.change(input, { target: { value: "Za krótki tekst" } });
    
    const button = screen.getByRole("button", { name: /Generuj fiszki AI/i });
    expect(button).toBeDisabled();
  });

  it("wyświetla błąd walidacji po wyjściu z pola (blur), gdy tekst jest za krótki", async () => {
    render(<AIGenerationForm onGenerate={mockOnGenerate} isGenerating={false} hasActiveProposals={false} />);
    
    const input = screen.getByLabelText(/Wklej tekst źródłowy/i);
    fireEvent.change(input, { target: { value: "Krótki" } });
    fireEvent.blur(input);
    
    expect(await screen.findByText(/Tekst jest za krótki/i)).toBeInTheDocument();
  });

  it("umożliwia generowanie, gdy tekst ma odpowiednią długość", async () => {
    render(<AIGenerationForm onGenerate={mockOnGenerate} isGenerating={false} hasActiveProposals={false} />);
    
    const longText = "a".repeat(1001);
    const input = screen.getByLabelText(/Wklej tekst źródłowy/i);
    fireEvent.change(input, { target: { value: longText } });
    
    const button = screen.getByRole("button", { name: /Generuj fiszki AI/i });
    expect(button).not.toBeDisabled();
    
    fireEvent.click(button);
    expect(mockOnGenerate).toHaveBeenCalledWith(longText);
  });

  it("blokuje generowanie, gdy są już aktywne propozycje", () => {
    render(<AIGenerationForm onGenerate={mockOnGenerate} isGenerating={false} hasActiveProposals={true} />);
    
    expect(screen.getByText(/Aby wygenerować kolejne propozycje, najpierw zapisz lub usuń/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generuj fiszki AI/i })).toBeDisabled();
  });
});
