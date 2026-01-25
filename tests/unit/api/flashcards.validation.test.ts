import { describe, it, expect } from "vitest";
import { flashcardSchema, querySchema } from "../../../src/pages/api/flashcards/index";

describe("Flashcards API Validation Schemas", () => {
  describe("flashcardSchema", () => {
    it("should validate a valid manual flashcard", () => {
      const data = {
        front: "Front content",
        back: "Back content",
        source: "manual",
      };
      const result = flashcardSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate a valid AI flashcard with generation_id", () => {
      const data = {
        front: "AI Front",
        back: "AI Back",
        source: "ai-full",
        generation_id: "550e8400-e29b-41d4-a716-446655440000",
      };
      const result = flashcardSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should fail if front is too long", () => {
      const data = {
        front: "a".repeat(201),
        back: "Back",
        source: "manual",
      };
      const result = flashcardSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Front is too long");
      }
    });

    it("should fail if generation_id is missing for AI source", () => {
      const data = {
        front: "AI Front",
        back: "AI Back",
        source: "ai-full",
      };
      const result = flashcardSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("generation_id is required for AI-generated flashcards");
      }
    });

    it("should fail if generation_id is invalid UUID", () => {
      const data = {
        front: "AI Front",
        back: "AI Back",
        source: "ai-full",
        generation_id: "invalid-uuid",
      };
      const result = flashcardSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("querySchema", () => {
    it("should use default values for empty query", () => {
      const result = querySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          page: 1,
          limit: 50,
          sort: "created_at",
          order: "desc",
        });
      }
    });

    it("should coerce string numbers for page and limit", () => {
      const result = querySchema.safeParse({ page: "2", limit: "10" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
      }
    });

    it("should fail if limit exceeds 100", () => {
      const result = querySchema.safeParse({ limit: "101" });
      expect(result.success).toBe(false);
    });

    it("should fail for invalid source", () => {
      const result = querySchema.safeParse({ source: "invalid" });
      expect(result.success).toBe(false);
    });
  });
});
