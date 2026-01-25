/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlashcardService } from "../../../src/lib/services/flashcard.service";
import type { SupabaseClient } from "../../../src/db/supabase.client";
import type { UpdateFlashcardCommand, CreateFlashcardCommand } from "../../../src/types";

describe("FlashcardService", () => {
  let mockSupabase: any;
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a more robust fluent mock for Supabase
    // Each method returns the mock object, and the mock object is also a thenable (Promise-like)
    const createFluentMock = () => {
      const mock: any = {
        from: vi.fn().mockImplementation(() => mock),
        select: vi.fn().mockImplementation(() => mock),
        insert: vi.fn().mockImplementation(() => mock),
        update: vi.fn().mockImplementation(() => mock),
        delete: vi.fn().mockImplementation(() => mock),
        eq: vi.fn().mockImplementation(() => mock),
        single: vi.fn().mockImplementation(() => mock),
        maybeSingle: vi.fn().mockImplementation(() => mock),
        order: vi.fn().mockImplementation(() => mock),
        range: vi.fn().mockImplementation(() => mock),
        // Add then to make it awaitable
        then: vi.fn().mockImplementation((onFulfilled) => {
          return Promise.resolve({ data: null, error: null }).then(onFulfilled);
        }),
      };
      return mock;
    };

    mockSupabase = createFluentMock();
  });

  describe("updateFlashcard", () => {
    const flashcardId = "fc-1";

    it("should throw error when trying to change source from manual to AI", async () => {
      // Setup: current flashcard is manual
      mockSupabase.then.mockImplementationOnce((onFulfilled: any) => {
        return Promise.resolve({
          data: { id: flashcardId, source: "manual", front: "Q", back: "A" },
          error: null,
        }).then(onFulfilled);
      });

      const command: UpdateFlashcardCommand = { source: "ai-full" };

      await expect(
        FlashcardService.updateFlashcard(mockSupabase as unknown as SupabaseClient, userId, flashcardId, command)
      ).rejects.toMatchObject({
        code: "INVALID_SOURCE_TRANSITION",
      });
    });

    it("should auto-transition from ai-full to ai-edited when content changes", async () => {
      const current = {
        id: flashcardId,
        source: "ai-full",
        front: "Old Q",
        back: "Old A",
        generation_id: "gen-1",
        user_id: userId,
      };

      // 1. getFlashcardById call
      mockSupabase.then.mockImplementationOnce((onFulfilled: any) => {
        return Promise.resolve({ data: current, error: null }).then(onFulfilled);
      });

      // 2. update() call
      const updated = { ...current, front: "New Q", source: "ai-edited" };
      mockSupabase.then.mockImplementationOnce((onFulfilled: any) => {
        return Promise.resolve({ data: updated, error: null }).then(onFulfilled);
      });

      // 3. syncGenerationStatsOnEdit -> fetch current counts
      mockSupabase.then.mockImplementationOnce((onFulfilled: any) => {
        return Promise.resolve({
          data: { count_accepted_unedited: 5, count_accepted_edited: 2 },
          error: null,
        }).then(onFulfilled);
      });

      // 4. syncGenerationStatsOnEdit -> update counts
      mockSupabase.then.mockImplementationOnce((onFulfilled: any) => {
        return Promise.resolve({ error: null }).then(onFulfilled);
      });

      const command: UpdateFlashcardCommand = { front: "New Q" };

      const result = await FlashcardService.updateFlashcard(
        mockSupabase as unknown as SupabaseClient,
        userId,
        flashcardId,
        command
      );

      expect(result.source).toBe("ai-edited");
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          source: "ai-edited",
          front: "New Q",
        })
      );
      expect(mockSupabase.from).toHaveBeenCalledWith("generations");
    });
  });

  describe("deleteFlashcard", () => {
    it("should sync generation stats when deleting an AI flashcard", async () => {
      const flashcardId = "fc-1";
      const current = {
        id: flashcardId,
        source: "ai-full",
        generation_id: "gen-1",
        user_id: userId,
      };

      // 1. getFlashcardById
      mockSupabase.then.mockImplementationOnce((onFulfilled: any) => {
        return Promise.resolve({ data: current, error: null }).then(onFulfilled);
      });

      // 2. delete execution
      mockSupabase.then.mockImplementationOnce((onFulfilled: any) => {
        return Promise.resolve({ error: null }).then(onFulfilled);
      });

      // 3. syncGenerationStatsOnDelete -> fetch current counts
      mockSupabase.then.mockImplementationOnce((onFulfilled: any) => {
        return Promise.resolve({
          data: { count_accepted_unedited: 5, count_accepted_edited: 2 },
          error: null,
        }).then(onFulfilled);
      });

      // 4. syncGenerationStatsOnDelete -> update counts
      mockSupabase.then.mockImplementationOnce((onFulfilled: any) => {
        return Promise.resolve({ error: null }).then(onFulfilled);
      });

      await FlashcardService.deleteFlashcard(mockSupabase as unknown as SupabaseClient, userId, flashcardId);

      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockSupabase.delete).toHaveBeenCalled();

      expect(mockSupabase.from).toHaveBeenCalledWith("generations");
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          count_accepted_unedited: 4,
        })
      );
    });
  });

  describe("createFlashcards", () => {
    it("should sync generation stats when creating AI flashcards", async () => {
      const commands: CreateFlashcardCommand[] = [
        { front: "Q1", back: "A1", source: "ai-full", generation_id: "gen-1" },
        { front: "Q2", back: "A2", source: "ai-edited", generation_id: "gen-1" },
      ];

      // 1. insert execution
      mockSupabase.then.mockImplementationOnce((onFulfilled: any) => {
        return Promise.resolve({
          data: [
            { id: "1", ...commands[0] },
            { id: "2", ...commands[1] },
          ],
          error: null,
        }).then(onFulfilled);
      });

      // 2. updateGenerationStats -> fetch current counts
      mockSupabase.then.mockImplementationOnce((onFulfilled: any) => {
        return Promise.resolve({
          data: { id: "gen-1", count_accepted_unedited: 10, count_accepted_edited: 5 },
          error: null,
        }).then(onFulfilled);
      });

      // 3. updateGenerationStats -> update counts
      mockSupabase.then.mockImplementationOnce((onFulfilled: any) => {
        return Promise.resolve({ error: null }).then(onFulfilled);
      });

      const result = await FlashcardService.createFlashcards(
        mockSupabase as unknown as SupabaseClient,
        userId,
        commands
      );

      expect(result).toHaveLength(2);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          count_accepted_unedited: 11,
          count_accepted_edited: 6,
        })
      );
    });
  });

  describe("getFlashcards", () => {
    it("should correctly calculate pagination range", async () => {
      mockSupabase.then.mockImplementationOnce((onFulfilled: any) => {
        return Promise.resolve({ data: [], count: 100, error: null }).then(onFulfilled);
      });

      await FlashcardService.getFlashcards(mockSupabase as unknown as SupabaseClient, userId, {
        page: 3,
        limit: 20,
      });

      expect(mockSupabase.range).toHaveBeenCalledWith(40, 59);
    });
  });
});
