import type { APIRoute } from "astro";
import { z } from "zod";
import { GenerationService } from "../../../lib/services/generation.service";
import type { ApiResponse, GenerationResponseDTO, ApiError } from "../../../types";

export const prerender = false;

const generateSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Tekst źródłowy musi mieć co najmniej 1000 znaków.")
    .max(10000, "Tekst źródłowy może mieć maksymalnie 10000 znaków."),
});

/**
 * POST /api/generations
 * 
 * API endpoint to trigger automatic flashcard generation from source text.
 * 
 * Request body:
 * {
 *   "source_text": string (1000 - 10000 characters)
 * }
 * 
 * Response: ApiResponse<GenerationResponseDTO>
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authenticate user (Skipped for now, using DEFAULT_USER_ID)
    
    // 2. Parse and validate request body
    const body = await request.json();
    const result = generateSchema.safeParse(body);

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

    // 3. Call generation service
    const generationData = await GenerationService.generateFlashcards(
      locals.supabase,
      result.data
    );

    // 4. Return success response
    const response: ApiResponse<GenerationResponseDTO> = {
      success: true,
      data: generationData,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (error: any) {
    console.error("API Error in /api/generations:", error);

    const apiError = error as ApiError;
    const status = 
      apiError.code === "DUPLICATE_GENERATION" ? 400 :
      apiError.code === "MOCK_TIMEOUT" ? 503 :
      500;

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
