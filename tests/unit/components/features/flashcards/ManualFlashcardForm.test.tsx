import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ManualFlashcardForm } from "@/components/features/flashcards/ManualFlashcardForm";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ManualFlashcardForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("wyświetla błędy walidacji dla pustych pól po próbie zapisu", async () => {
    render(<ManualFlashcardForm />);
    
    fireEvent.click(screen.getByRole("button", { name: /Dodaj fiszkę/i }));
    
    const errorMessages = await screen.findAllByText(/To pole nie może być puste/i);
    expect(errorMessages).toHaveLength(2);
  });

  it("poprawnie wysyła dane i czyści formularz po sukcesie", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<ManualFlashcardForm />);
    
    fireEvent.change(screen.getByLabelText(/Przód fiszki/i), { target: { value: "Pytanie" } });
    fireEvent.change(screen.getByLabelText(/Tył fiszki/i), { target: { value: "Odpowiedź" } });
    
    fireEvent.click(screen.getByRole("button", { name: /Dodaj fiszkę/i }));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/flashcards", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ front: "Pytanie", back: "Odpowiedź", source: "manual" }),
      }));
    });

    expect(toast.success).toHaveBeenCalledWith("Fiszka została utworzona pomyślnie!");
    
    // Sprawdzenie czy pola zostały wyczyszczone
    expect(screen.getByLabelText(/Przód fiszki/i)).toHaveValue("");
    expect(screen.getByLabelText(/Tył fiszki/i)).toHaveValue("");
  });

  it("obsługuje błędy z API", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { message: "Server error" } }),
    });

    render(<ManualFlashcardForm />);
    
    fireEvent.change(screen.getByLabelText(/Przód fiszki/i), { target: { value: "Pytanie" } });
    fireEvent.change(screen.getByLabelText(/Tył fiszki/i), { target: { value: "Odpowiedź" } });
    
    fireEvent.click(screen.getByRole("button", { name: /Dodaj fiszkę/i }));
    
    expect(await screen.findByText(/Server error/i)).toBeInTheDocument();
  });
});
