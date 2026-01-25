import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGenerationSession } from "@/components/hooks/useGenerationSession";

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      const newStore = { ...store };
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete newStore[key];
      store = newStore;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

vi.stubGlobal("sessionStorage", sessionStorageMock);

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("useGenerationSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.clear();
  });

  it("loads state from sessionStorage on mount", () => {
    sessionStorageMock.setItem("10x_flashcards_proposals", JSON.stringify([{ id: "1", front: "Q", back: "A" }]));
    sessionStorageMock.setItem("10x_flashcards_generation_id", "gen-123");

    const { result } = renderHook(() => useGenerationSession());

    expect(result.current.proposals).toHaveLength(1);
    expect(result.current.generationId).toBe("gen-123");
  });

  it("updates proposal in state", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          generation_id: "gen-123",
          proposals: [{ proposal_id: "p1", front: "Q1", back: "A1" }],
        },
      }),
    });

    const { result } = renderHook(() => useGenerationSession());

    await act(async () => {
      await result.current.generate("Source text");
    });

    act(() => {
      result.current.updateProposal("p1", { front: "Updated Q1" });
    });

    expect(result.current.proposals[0].front).toBe("Updated Q1");
  });

  it("generates flashcards and updates state", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          generation_id: "gen-123",
          proposals: [{ proposal_id: "p1", front: "Q1", back: "A1" }],
        },
      }),
    });

    const { result } = renderHook(() => useGenerationSession());

    let response: { success: boolean; error?: string } | undefined;
    await act(async () => {
      response = await result.current.generate("Source text");
    });

    expect(response).toEqual({ success: true });
    expect(result.current.proposals).toHaveLength(1);
    expect(result.current.proposals[0].id).toBe("p1");
    expect(result.current.generationId).toBe("gen-123");
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith("10x_flashcards_generation_id", "gen-123");
  });

  it("handles generation failure", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: { message: "Generation failed" },
      }),
    });

    const { result } = renderHook(() => useGenerationSession());

    let response: { success: boolean; error?: string } | undefined;
    await act(async () => {
      response = await result.current.generate("Source text");
    });

    expect(response?.success).toBe(false);
    expect(response?.error).toBe("Generation failed");
    expect(result.current.isGenerating).toBe(false);
  });

  it("saves bulk flashcards with accepted_only strategy", async () => {
    // Setup state with proposals
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          generation_id: "gen-123",
          proposals: [
            { proposal_id: "p1", front: "Q1", back: "A1" },
            { proposal_id: "p2", front: "Q2", back: "A2" },
          ],
        },
      }),
    });

    const { result } = renderHook(() => useGenerationSession());

    await act(async () => {
      await result.current.generate("text");
    });

    // Mark p1 as accepted
    act(() => {
      result.current.updateProposal("p1", { status: "accepted" });
    });

    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: [] }),
    });

    let saveResponse: { success: boolean; count?: number; error?: string } | undefined;
    await act(async () => {
      saveResponse = await result.current.saveBulk("accepted_only");
    });

    expect(saveResponse).toEqual({ success: true, count: 1 });
    // Verify fetch was called with only p1
    const fetchCall = mockFetch.mock.calls.find((call) => call[0] === "/api/flashcards");
    expect(fetchCall).toBeDefined();
    if (fetchCall && fetchCall[1]) {
      const body = JSON.parse(fetchCall[1].body);
      expect(body).toHaveLength(1);
      expect(body[0].front).toBe("Q1");
    }
  });

  it("clears session correctly", async () => {
    sessionStorageMock.setItem("10x_flashcards_proposals", "[]");
    const { result } = renderHook(() => useGenerationSession());

    act(() => {
      result.current.clearSession();
    });

    expect(result.current.proposals).toHaveLength(0);
    expect(result.current.generationId).toBeNull();
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("10x_flashcards_proposals");
  });
});
