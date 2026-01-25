import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    } as any);
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
    } as any);

    const { unmount } = render(<CreateFlashcardsContainer />);
    
    expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });
});
