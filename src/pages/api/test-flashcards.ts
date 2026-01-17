import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import type { ApiResponse } from "../../types";

export const prerender = false;

/**
 * GET /api/test-flashcards
 * 
 * Zunifikowany endpoint testowy, który weryfikuje działanie endpointu POST /api/flashcards.
 * Wykonuje realne zapytania HTTP do API, sprawdzając zarówno sukcesy, jak i błędy walidacji.
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const apiEndpoint = `${baseUrl}/api/flashcards`;

  try {
    // 1. Pobierz ID istniejącej generacji do testów AI
    const { data: generation } = await locals.supabase
      .from("generations")
      .select("id")
      .eq("user_id", DEFAULT_USER_ID)
      .limit(1)
      .maybeSingle();

    const testResults: any[] = [];

    const runTest = async (name: string, payload: any, expectedStatus: number) => {
      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        const data = await response.json();
        const success = response.status === expectedStatus;
        
        testResults.push({
          name,
          expectedStatus,
          actualStatus: response.status,
          success,
          response: data
        });
        
        return { success, data };
      } catch (err: any) {
        testResults.push({
          name,
          error: err.message,
          success: false
        });
        return { success: false };
      }
    };

    // Scenariusz 1: Sukces - Pojedyncza fiszka manualna
    await runTest("Success: Single Manual", {
      front: "Stolica Polski",
      back: "Warszawa",
      source: "manual"
    }, 201);

    // Scenariusz 2: Sukces - Masowe fiszki AI
    if (generation) {
      await runTest("Success: Bulk AI", [
        {
          front: "Proton",
          back: "Ładunek dodatni",
          source: "ai-full",
          generation_id: generation.id
        },
        {
          front: "Elektron",
          back: "Ładunek ujemny",
          source: "ai-edited",
          generation_id: generation.id
        }
      ], 201);
    } else {
      testResults.push({ name: "Success: Bulk AI", skipped: "No generation found" });
    }

    // Scenariusz 3: Błąd - Brak wymaganego pola
    await runTest("Error: Missing field", {
      front: "Tylko front",
      source: "manual"
    }, 400);

    // Scenariusz 4: Błąd - AI bez generation_id
    await runTest("Error: AI without generation_id", {
      front: "Test AI",
      back: "Błąd braku ID",
      source: "ai-full"
    }, 400);

    // Scenariusz 5: Błąd - Przekroczenie limitu znaków
    await runTest("Error: Length limit exceeded", {
      front: "A".repeat(201), // Max 200
      back: "Test",
      source: "manual"
    }, 400);

    // Sprawdzenie statystyk (tylko jeśli był test AI)
    let statsAfter: any = null;
    if (generation) {
       const { data } = await locals.supabase
        .from("generations")
        .select("count_accepted_unedited, count_accepted_edited")
        .eq("id", generation.id)
        .single();
       statsAfter = data;
    }

    return new Response(
      JSON.stringify({
        success: testResults.every(r => r.success || r.skipped),
        tests: testResults,
        stats_check: statsAfter
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
