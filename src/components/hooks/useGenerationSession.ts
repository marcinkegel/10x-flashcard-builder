import { useState, useEffect } from "react";
import type {
  FlashcardProposalViewModel,
  GenerateFlashcardsCommand,
  GenerationResponseDTO,
  ApiResponse,
  CreateFlashcardCommand,
  FlashcardDTO,
} from "../../types";

export type SaveStrategy = "accepted_only" | "non_rejected";

const STORAGE_KEY_PROPOSALS = "10x_flashcards_proposals";
const STORAGE_KEY_GENERATION_ID = "10x_flashcards_generation_id";

/**
 * Hook managing the AI generation session state, persistence, and API calls.
 */
export function useGenerationSession() {
  const [proposals, setProposals] = useState<FlashcardProposalViewModel[]>([]);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Persystencja: Load from sessionStorage on mount
  useEffect(() => {
    const savedProposals = sessionStorage.getItem(STORAGE_KEY_PROPOSALS);
    const savedGenId = sessionStorage.getItem(STORAGE_KEY_GENERATION_ID);

    if (savedProposals) {
      try {
        setProposals(JSON.parse(savedProposals));
      } catch {
        // Silent error for malformed storage
      }
    }
    if (savedGenId) {
      setGenerationId(savedGenId);
    }
  }, []);

  // 1. Persystencja: Save to sessionStorage when state changes
  useEffect(() => {
    if (proposals.length > 0) {
      sessionStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify(proposals));
    } else {
      sessionStorage.removeItem(STORAGE_KEY_PROPOSALS);
    }
  }, [proposals]);

  useEffect(() => {
    if (generationId) {
      sessionStorage.setItem(STORAGE_KEY_GENERATION_ID, generationId);
    } else {
      sessionStorage.removeItem(STORAGE_KEY_GENERATION_ID);
    }
  }, [generationId]);

  /**
   * Triggers the generation process via API.
   * Woła POST /api/generations.
   */
  const generate = async (text: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_text: text } as GenerateFlashcardsCommand),
      });

      const result: ApiResponse<GenerationResponseDTO> = await response.json();

      if (result.success && result.data) {
        const newProposals: FlashcardProposalViewModel[] = result.data.proposals.map((p) => ({
          id: p.proposal_id,
          front: p.front,
          back: p.back,
          source: "ai-full",
          status: "pending",
          isEditing: false,
        }));
        setProposals(newProposals);
        setGenerationId(result.data.generation_id);
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error?.message || "Generowanie nie powiodło się.",
        };
      }
    } catch {
      return {
        success: false,
        error: "Wystąpił błąd sieciowy podczas generowania.",
      };
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Updates a single proposal in the state.
   */
  const updateProposal = (id: string, partialChanges: Partial<FlashcardProposalViewModel>) => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, ...partialChanges } : p)));
  };

  /**
   * Saves a bulk of proposals based on the selected strategy.
   * Woła POST /api/flashcards.
   */
  const saveBulk = async (strategy: SaveStrategy) => {
    if (!generationId) return { success: false, error: "Brak identyfikatora sesji." };

    const toSave = proposals.filter((p) => {
      if (strategy === "accepted_only") return p.status === "accepted";
      if (strategy === "non_rejected") return p.status !== "rejected";
      return false;
    });

    if (toSave.length === 0) {
      return { success: false, error: "Brak fiszek do zapisania przy wybranej strategii." };
    }

    setIsSaving(true);
    try {
      const commands: CreateFlashcardCommand[] = toSave.map((p) => ({
        front: p.front,
        back: p.back,
        source: p.source,
        generation_id: generationId,
      }));

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commands),
      });

      const result: ApiResponse<FlashcardDTO[]> = await response.json();

      if (result.success) {
        // Przy dokonywaniu zapisu bulk, odrzucone fiszki również są usuwane z widoku
        const remainingProposals = proposals.filter((p) => p.status === "pending" && strategy === "accepted_only");

        setProposals(remainingProposals);

        if (remainingProposals.length === 0) {
          setGenerationId(null);
        }

        return { success: true, count: toSave.length };
      } else {
        return {
          success: false,
          error: result.error?.message || "Błąd podczas zapisywania fiszek.",
        };
      }
    } catch {
      return {
        success: false,
        error: "Wystąpił błąd sieciowy podczas zapisywania.",
      };
    } finally {
      setIsSaving(false);
    }
  };

  const clearSession = () => {
    setProposals([]);
    setGenerationId(null);
    sessionStorage.removeItem(STORAGE_KEY_PROPOSALS);
    sessionStorage.removeItem(STORAGE_KEY_GENERATION_ID);
  };

  return {
    proposals,
    generationId,
    isGenerating,
    isSaving,
    generate,
    updateProposal,
    saveBulk,
    clearSession,
  };
}
