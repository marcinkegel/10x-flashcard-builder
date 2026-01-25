/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerationService } from "../../../src/lib/services/generation.service";
import type { SupabaseClient } from "../../../src/db/supabase.client";
import type { GenerateFlashcardsCommand } from "../../../src/types";
import { OpenRouterService } from "../../../src/lib/services/openrouter.service";

// Mock the whole module automatically
vi.mock("../../../src/lib/services/openrouter.service");

describe("GenerationService", () => {
  let mockSupabase: any;
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };
  });

  describe("generateFlashcards", () => {
    const command: GenerateFlashcardsCommand = { source_text: "Sample educational text" };

    it("should throw error if duplicate generation is found", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: { id: "gen-1" }, error: null });

      await expect(
        GenerationService.generateFlashcards(mockSupabase as unknown as SupabaseClient, userId, command)
      ).rejects.toMatchObject({
        code: "DUPLICATE_GENERATION",
      });
    });

    it("should log error to DB if initial record creation fails", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: "DB Error" } });

      await expect(
        GenerationService.generateFlashcards(mockSupabase as unknown as SupabaseClient, userId, command)
      ).rejects.toMatchObject({
        code: "DB_ERROR",
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("generation_error_logs");
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          error_code: "DB_ERROR",
        })
      );
    });

    it("should successfully coordinate generation and update record", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const generationId = "gen-1234-5678";
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: generationId },
        error: null,
      });

      const mockProposals = [
        { front: "Q1", back: "A1" },
        { front: "Q2", back: "A2" },
      ];

      // Since OpenRouterService is mocked, its prototype methods are mocks
      vi.mocked(OpenRouterService.prototype.generateChatCompletion).mockResolvedValueOnce({
        proposals: mockProposals,
      });

      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.maybeSingle.mockResolvedValueOnce({ error: null });

      const result = await GenerationService.generateFlashcards(
        mockSupabase as unknown as SupabaseClient,
        userId,
        command
      );

      expect(result.generation_id).toBe(generationId);
      expect(result.proposals).toHaveLength(2);
      expect(mockSupabase.update).toHaveBeenCalledWith({ count_generated: 2 });
    });

    it("should log specific AI errors and rethrow", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: { id: "gen-1" }, error: null });

      vi.mocked(OpenRouterService.prototype.generateChatCompletion).mockRejectedValueOnce(new Error("429 Rate Limit"));

      await expect(
        GenerationService.generateFlashcards(mockSupabase as unknown as SupabaseClient, userId, command)
      ).rejects.toMatchObject({
        code: "AI_RATE_LIMIT_ERROR",
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("generation_error_logs");
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          error_code: "AI_RATE_LIMIT_ERROR",
        })
      );
    });
  });
});
