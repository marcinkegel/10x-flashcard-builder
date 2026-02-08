import type { APIRoute } from "astro";
import { GenerationService } from "../../lib/services/generation.service";
import type { ApiResponse } from "../../types";

export const prerender = false;

/**
 * GET /api/test-generation
 *
 * Internal test endpoint to verify the generation flow.
 * Triggers a sample generation with a valid text.
 */
export const GET: APIRoute = async (context) => {
  const { locals } = context;
  // Use a string of 1000 characters to pass validation if we were using the endpoint,
  // but here we call the service directly.
  const sampleText = "To jest testowy tekst o długości ponad tysiąca znaków. ".repeat(20);

  try {
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // @ts-expect-error - Cloudflare runtime is injected by the adapter
    const runtimeEnv = context.locals.runtime?.env;
    const result = await GenerationService.generateFlashcards(
      locals.supabase,
      user.id,
      { source_text: sampleText },
      runtimeEnv
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      } as ApiResponse<GenerationResponseDTO>),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[TestEndpoint] Test failed:", error);

    const err = error as ApiError;
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: err.code || "TEST_FAILED",
          message: err.message || "Test generation failed.",
        },
      } as ApiResponse<never>),
      {
        status: err.code === "DUPLICATE_GENERATION" ? 400 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
