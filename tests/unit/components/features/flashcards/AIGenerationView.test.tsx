import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIGenerationView } from "@/components/features/flashcards/AIGenerationView";
import { useGenerationSession } from "@/components/hooks/useGenerationSession";
import { toast } from "sonner";

vi.mock("@/components/hooks/useGenerationSession");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/components/features/flashcards/AIGenerationForm", () => ({
  AIGenerationForm: () => <div>AI Generation Form</div>,
}));
vi.mock("@/components/features/flashcards/ProposalList", () => ({
  ProposalList: () => <div>Proposal List</div>,
}));
vi.mock("@/components/features/flashcards/BulkActionToolbar", () => ({
  BulkActionToolbar: ({ onSave, onClear }: { onSave: (s: string) => void; onClear: () => void }) => (
    <div>
      <button onClick={() => onSave("accepted_only")}>Save Accepted</button>
      <button onClick={onClear}>Clear</button>
    </div>
  ),
}));

describe("AIGenerationView", () => {
  const mockSaveBulk = vi.fn();
  const mockClearSession = vi.fn();

  beforeEach(() => {
    vi.mocked(useGenerationSession).mockReturnValue({
      proposals: [],
      generationId: null,
      isGenerating: false,
      isSaving: false,
      generate: vi.fn(),
      updateProposal: vi.fn(),
      saveBulk: mockSaveBulk,
      clearSession: mockClearSession,
    } as ReturnType<typeof useGenerationSession>);

    vi.stubGlobal(
      "confirm",
      vi.fn(() => true)
    );
  });

  it("wyświetla pusty formularz na początku", () => {
    render(<AIGenerationView />);
    expect(screen.getByText(/Nowa sesja generowania/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Generation Form/i)).toBeInTheDocument();
  });

  it("wyświetla listę propozycji, gdy są dostępne", () => {
    vi.mocked(useGenerationSession).mockReturnValue({
      proposals: [{ id: "1", front: "Q", back: "A", status: "pending", source: "ai-full", isEditing: false }],
      generationId: "session-1",
      isGenerating: false,
      isSaving: false,
      generate: vi.fn(),
      updateProposal: vi.fn(),
      saveBulk: mockSaveBulk,
      clearSession: mockClearSession,
    } as ReturnType<typeof useGenerationSession>);

    render(<AIGenerationView />);
    expect(screen.getByText(/Propozycje AI \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Proposal List/i)).toBeInTheDocument();
  });

  it("obsługuje zapisywanie masowe", async () => {
    mockSaveBulk.mockResolvedValueOnce({ success: true, count: 5 });
    vi.mocked(useGenerationSession).mockReturnValue({
      proposals: [{ id: "1", front: "Q", back: "A", status: "accepted", source: "ai-full", isEditing: false }],
      generationId: "session-1",
      isGenerating: false,
      isSaving: false,
      generate: vi.fn(),
      updateProposal: vi.fn(),
      saveBulk: mockSaveBulk,
      clearSession: mockClearSession,
    } as ReturnType<typeof useGenerationSession>);

    render(<AIGenerationView />);

    fireEvent.click(screen.getByText(/Save Accepted/i));

    await waitFor(() => {
      expect(mockSaveBulk).toHaveBeenCalledWith("accepted_only");
      expect(toast.success).toHaveBeenCalledWith("Zapisano 5 fiszek!");
    });
  });

  it("obsługuje czyszczenie sesji z potwierdzeniem", () => {
    vi.mocked(useGenerationSession).mockReturnValue({
      proposals: [{ id: "1", front: "Q", back: "A", status: "pending", source: "ai-full", isEditing: false }],
      generationId: "session-1",
      isGenerating: false,
      isSaving: false,
      generate: vi.fn(),
      updateProposal: vi.fn(),
      saveBulk: mockSaveBulk,
      clearSession: mockClearSession,
    } as ReturnType<typeof useGenerationSession>);

    render(<AIGenerationView />);

    fireEvent.click(screen.getByText(/Clear/i));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockClearSession).toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith("Wyczyszczono listę propozycji.");
  });
});
