import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import type { ApiResponse, FlashcardDTO, ApiError } from "../../../types";

export const prerender = false;

// Validation schema for a single flashcard
export const flashcardSchema = z
  .object({
    front: z.string().trim().min(1, "Front cannot be empty").max(200, "Front is too long"),
    back: z.string().trim().min(1, "Back cannot be empty").max(500, "Back is too long"),
    source: z.enum(["ai-full", "ai-edited", "manual"]),
    generation_id: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      // If source is AI-based, generation_id must be provided
      if ((data.source === "ai-full" || data.source === "ai-edited") && !data.generation_id) {
        return false;
      }
      return true;
    },
    {
      message: "generation_id is required for AI-generated flashcards",
      path: ["generation_id"],
    }
  );

// Support both a single object and an array of objects
export const requestSchema = z.union([flashcardSchema, z.array(flashcardSchema)]);

// Validation schema for GET query parameters
export const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
  sort: z.enum(["created_at", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * GET /api/flashcards
 *
 * API endpoint to retrieve a paginated list of flashcards.
 * Supports filtering by source and custom sorting.
 *
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - source: "ai-full" | "ai-edited" | "manual" (optional)
 * - sort: "created_at" | "updated_at" (default: "created_at")
 * - order: "asc" | "desc" (default: "desc")
 *
 * Response: ApiResponse<PaginatedData<FlashcardDTO>>
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authenticate user
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Musisz być zalogowany, aby przeglądać fiszki.",
          },
        } as ApiResponse<never>),
        { status: 401 }
      );
    }

    // 2. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const result = querySchema.safeParse(queryParams);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Błędne parametry zapytania.",
            details: result.error.flatten().fieldErrors,
          },
        } as ApiResponse<never>),
        { status: 400 }
      );
    }

    // 3. Call flashcard service
    const paginatedData = await FlashcardService.getFlashcards(locals.supabase, user.id, result.data);

    // 4. Return success response
    const response: ApiResponse<PaginatedData<FlashcardDTO>> = {
      success: true,
      data: paginatedData,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("API Error in GET /api/flashcards:", error);

    const apiError = error as ApiError;
    const status = apiError.code === "NOT_FOUND" ? 404 : 500;

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
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Musisz być zalogowany, aby tworzyć fiszki.",
          },
        } as ApiResponse<never>),
        { status: 401 }
      );
    }
    const userId = user.id;

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
    const createdFlashcards = await FlashcardService.createFlashcards(locals.supabase, userId, result.data);

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
  } catch (error) {
    // eslint-disable-next-line no-console
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
