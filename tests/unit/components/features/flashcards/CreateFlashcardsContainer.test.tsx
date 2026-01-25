import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateFlashcardsContainer from "@/components/features/flashcards/CreateFlashcardsContainer";
import { useGenerationSession } from "@/components/hooks/useGenerationSession";

vi.mock("@/components/hooks/useGenerationSession");
vi.mock("./AIGenerationView", () => ({ AIGenerationView: () => <div>AI View</div> }));
vi.mock("./ManualCreationView", () => ({ ManualCreationView: () => <div>Manual View</div> }));

describe("CreateFlashcardsContainer", () => {
  beforeEach(() => {
    vi.mocked(useGenerationSession).mockReturnValue({
      proposals: [],
      generationId: null,
      isGenerating: false,
      isSaving: false,
      generate: vi.fn(),
      updateProposal: vi.fn(),
      saveBulk: vi.fn(),
      clearSession: vi.fn(),
    } as ReturnType<typeof useGenerationSession>);
  });

  it("wyświetla taby AI i Ręczne", () => {
    render(<CreateFlashcardsContainer />);

    expect(screen.getByRole("tab", { name: /Generowanie AI/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Tworzenie ręczne/i })).toBeInTheDocument();
  });

  it("rejestruje listener beforeunload, gdy są propozycje", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    vi.mocked(useGenerationSession).mockReturnValue({
      proposals: [{ id: "1" }],
      generationId: "session-1",
      isGenerating: false,
      isSaving: false,
      generate: vi.fn(),
      updateProposal: vi.fn(),
      saveBulk: vi.fn(),
      clearSession: vi.fn(),
    } as ReturnType<typeof useGenerationSession>);

    const { unmount } = render(<CreateFlashcardsContainer />);

    expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    unmount();
    expect(removeSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });
});
