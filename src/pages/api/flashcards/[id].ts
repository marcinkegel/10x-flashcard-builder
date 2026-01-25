import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import type { ApiResponse, FlashcardDTO, ApiError } from "../../../types";

export const prerender = false;

// Validation schema for updating a flashcard
const updateFlashcardSchema = z.object({
  front: z.string().trim().min(1, "Front cannot be empty").max(200, "Front is too long").optional(),
  back: z.string().trim().min(1, "Back cannot be empty").max(500, "Back is too long").optional(),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
});

/**
 * GET /api/flashcards/[id]
 *
 * API endpoint to retrieve details of a single flashcard.
 *
 * Path parameters:
 * - id: string (UUID)
 *
 * Response: ApiResponse<FlashcardDTO>
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "BAD_REQUEST", message: "Brak identyfikatora fiszki." },
        } as ApiResponse<never>),
        { status: 400 }
      );
    }

    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Musisz być zalogowany." },
        } as ApiResponse<never>),
        { status: 401 }
      );
    }

    const flashcard = await FlashcardService.getFlashcardById(locals.supabase, user.id, id);

    return new Response(
      JSON.stringify({
        success: true,
        data: flashcard,
      } as ApiResponse<FlashcardDTO>),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`API Error in GET /api/flashcards/${params.id}:`, error);
    const apiError = error as ApiError;
    const status = apiError.code === "NOT_FOUND" ? 404 : 500;

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: apiError.code || "INTERNAL_SERVER_ERROR",
          message: apiError.message || "Wystąpił błąd serwera.",
        },
      } as ApiResponse<never>),
      { status, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * PUT /api/flashcards/[id]
 *
 * API endpoint to update an existing flashcard.
 *
 * Path parameters:
 * - id: string (UUID)
 *
 * Request body (UpdateFlashcardCommand):
 * - front?: string (1-200)
 * - back?: string (1-500)
 * - source?: "ai-full" | "ai-edited" | "manual"
 *
 * Response: ApiResponse<FlashcardDTO>
 */
export const PUT: APIRoute = async ({ request, params, locals }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "BAD_REQUEST", message: "Brak identyfikatora fiszki." },
        } as ApiResponse<never>),
        { status: 400 }
      );
    }

    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Musisz być zalogowany." },
        } as ApiResponse<never>),
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = updateFlashcardSchema.safeParse(body);

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

    const updatedFlashcard = await FlashcardService.updateFlashcard(locals.supabase, user.id, id, result.data);

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedFlashcard,
        message: "Flashcard updated successfully",
      } as ApiResponse<FlashcardDTO>),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`API Error in PUT /api/flashcards/${params.id}:`, error);
    const apiError = error as ApiError;
    let status = 500;
    if (apiError.code === "NOT_FOUND") status = 404;
    if (apiError.code === "INVALID_SOURCE_TRANSITION") status = 400;

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: apiError.code || "INTERNAL_SERVER_ERROR",
          message: apiError.message || "Wystąpił błąd serwera.",
        },
      } as ApiResponse<never>),
      { status, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * DELETE /api/flashcards/[id]
 *
 * API endpoint to delete a flashcard.
 *
 * Path parameters:
 * - id: string (UUID)
 *
 * Response: ApiResponse<void>
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "BAD_REQUEST", message: "Brak identyfikatora fiszki." },
        } as ApiResponse<never>),
        { status: 400 }
      );
    }

    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Musisz być zalogowany." },
        } as ApiResponse<never>),
        { status: 401 }
      );
    }

    await FlashcardService.deleteFlashcard(locals.supabase, user.id, id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Flashcard deleted successfully",
      } as ApiResponse<void>),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`API Error in DELETE /api/flashcards/${params.id}:`, error);
    const apiError = error as ApiError;
    const status = apiError.code === "NOT_FOUND" ? 404 : 500;

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: apiError.code || "INTERNAL_SERVER_ERROR",
          message: apiError.message || "Wystąpił błąd serwera.",
        },
      } as ApiResponse<never>),
      { status, headers: { "Content-Type": "application/json" } }
    );
  }
};
