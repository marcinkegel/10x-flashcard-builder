import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import type { ApiResponse, FlashcardDTO, ApiError } from "../../../types";

export const prerender = false;

// Validation schema for a single flashcard
const flashcardSchema = z.object({
  front: z.string().trim().min(1, "Front cannot be empty").max(200, "Front is too long"),
  back: z.string().trim().min(1, "Back cannot be empty").max(500, "Back is too long"),
  source: z.enum(["ai-full", "ai-edited", "manual"]),
  generation_id: z.string().uuid().optional(),
}).refine(data => {
  // If source is AI-based, generation_id must be provided
  if ((data.source === "ai-full" || data.source === "ai-edited") && !data.generation_id) {
    return false;
  }
  return true;
}, {
  message: "generation_id is required for AI-generated flashcards",
  path: ["generation_id"]
});

// Support both a single object and an array of objects
const requestSchema = z.union([
  flashcardSchema,
  z.array(flashcardSchema)
]);

/**
 * POST /api/flashcards
 * 
 * API endpoint to create one or more flashcards.
 * Supports manual creation and AI-generated flashcards.
 * 
 * Request body:
 * Single object or array of objects:
 * {
 *   "front": string (1-200),
 *   "back": string (1-500),
 *   "source": "manual" | "ai-full" | "ai-edited",
 *   "generation_id": string (UUID, optional/required for AI)
 * }
 * 
 * Response: ApiResponse<FlashcardDTO[]>
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authenticate user
    // In a real app, we'd get this from the session. 
    // Following existing pattern in GenerationService:
    const userId = DEFAULT_USER_ID;

    // 2. Parse and validate request body
    const body = await request.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Błędne dane wejściowe.",
            details: result.error.flatten().fieldErrors,
          },
        } as ApiResponse<never>),
        { status: 400 }
      );
    }

    // 3. Call flashcard service
    const createdFlashcards = await FlashcardService.createFlashcards(
      locals.supabase,
      userId,
      result.data
    );

    // 4. Return success response
    const response: ApiResponse<FlashcardDTO[]> = {
      success: true,
      data: createdFlashcards,
      message: "Flashcard(s) created",
    };

    return new Response(JSON.stringify(response), {
      status: 201, // Created
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (error: any) {
    console.error("API Error in POST /api/flashcards:", error);

    const apiError = error as ApiError;
    const status = 500; // Default to internal server error

    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: apiError.code || "INTERNAL_SERVER_ERROR",
        message: apiError.message || "Wystąpił nieoczekiwany błąd serwera.",
      },
    };

    return new Response(JSON.stringify(response), {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
