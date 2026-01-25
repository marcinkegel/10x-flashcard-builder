import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditFlashcardDialog } from "@/components/features/flashcards/EditFlashcardDialog";
import type { FlashcardDTO } from "@/types";
import { toast } from "sonner";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("EditFlashcardDialog", () => {
  const mockFlashcard: FlashcardDTO = {
    id: "f-1",
    front: "Original Front",
    back: "Original Back",
    source: "manual",
    user_id: "u-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial values when open", () => {
    render(
      <EditFlashcardDialog flashcard={mockFlashcard} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    expect(screen.getByLabelText(/Przód/i)).toHaveValue("Original Front");
    expect(screen.getByLabelText(/Tył/i)).toHaveValue("Original Back");
  });

  it("validates empty fields", async () => {
    const user = userEvent.setup();
    render(
      <EditFlashcardDialog flashcard={mockFlashcard} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const frontInput = screen.getByLabelText(/Przód/i);
    const backInput = screen.getByLabelText(/Tył/i);

    await user.clear(frontInput);
    await user.clear(backInput);

    // Save button is enabled if content is different from original
    const saveButton = screen.getByRole("button", { name: /Zapisz zmiany/i });
    await user.click(saveButton);

    expect(screen.getByText("Pole przód nie może być puste.")).toBeInTheDocument();
    expect(screen.getByText("Pole tył nie może być puste.")).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("disables save button when no changes were made", () => {
    render(
      <EditFlashcardDialog flashcard={mockFlashcard} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const saveButton = screen.getByRole("button", { name: /Zapisz zmiany/i });
    expect(saveButton).toBeDisabled();
  });

  it("enables save button when changes are made", async () => {
    const user = userEvent.setup();
    render(
      <EditFlashcardDialog flashcard={mockFlashcard} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const frontInput = screen.getByLabelText(/Przód/i);
    await user.type(frontInput, " changed");

    const saveButton = screen.getByRole("button", { name: /Zapisz zmiany/i });
    expect(saveButton).not.toBeDisabled();
  });

  it("calls API and triggers onSuccess on successful update", async () => {
    const user = userEvent.setup();
    const updatedFlashcard = { ...mockFlashcard, front: "Updated Front" };

    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: updatedFlashcard }),
    });

    render(
      <EditFlashcardDialog flashcard={mockFlashcard} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const frontInput = screen.getByLabelText(/Przód/i);
    await user.clear(frontInput);
    await user.type(frontInput, "Updated Front");

    await user.click(screen.getByRole("button", { name: /Zapisz zmiany/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/flashcards/f-1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            front: "Updated Front",
            back: "Original Back",
            source: "manual",
          }),
        })
      );
      expect(mockOnSuccess).toHaveBeenCalledWith(updatedFlashcard);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('updates source to "ai-edited" if original source was "ai-full" and content changed', async () => {
    const user = userEvent.setup();
    const aiFlashcard = { ...mockFlashcard, source: "ai-full" as const };

    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { ...aiFlashcard, front: "Original Front (edited)", source: "ai-edited" },
      }),
    });

    render(
      <EditFlashcardDialog flashcard={aiFlashcard} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const frontInput = screen.getByLabelText(/Przód/i);
    await user.type(frontInput, " (edited)");

    await user.click(screen.getByRole("button", { name: /Zapisz zmiany/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/flashcards/f-1",
        expect.objectContaining({
          body: expect.stringContaining('"source":"ai-edited"'),
        })
      );
    });
  });

  it("handles API errors", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <EditFlashcardDialog flashcard={mockFlashcard} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const frontInput = screen.getByLabelText(/Przód/i);
    await user.type(frontInput, " change");

    await user.click(screen.getByRole("button", { name: /Zapisz zmiany/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Wystąpił nieoczekiwany błąd.");
    });
  });
});
