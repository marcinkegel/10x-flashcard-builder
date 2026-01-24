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
export const GET: APIRoute = async ({ locals }) => {
  // Use a string of 1000 characters to pass validation if we were using the endpoint, 
  // but here we call the service directly.
  const sampleText = "To jest testowy tekst o długości ponad tysiąca znaków. ".repeat(20);
  
  try {
    console.log("[TestEndpoint] Starting test generation...");
    
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const result = await GenerationService.generateFlashcards(
      locals.supabase,
      user.id,
      { source_text: sampleText }
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      } as ApiResponse<any>),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[TestEndpoint] Test failed:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: error.code || "TEST_FAILED",
          message: error.message || "Test generation failed.",
        },
      } as ApiResponse<never>),
      {
        status: error.code === "DUPLICATE_GENERATION" ? 400 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
