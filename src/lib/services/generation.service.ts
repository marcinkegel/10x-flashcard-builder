import type { SupabaseClient } from "../../db/supabase.client";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import type { 
  GenerateFlashcardsCommand, 
  GenerationResponseDTO, 
  GenerationProposalDTO,
  ApiError
} from "../../types";
import { createHash } from "node:crypto";

/**
 * Service responsible for managing the flashcard generation process.
 * Handles deduplication, database logging, and coordination with AI models (currently mocked).
 */
export class GenerationService {
  private static MOCK_MODEL_NAME = "mock-gemini-3-flash";

  /**
   * Generates an MD5 hash from the source text.
   * Used for deduplication to prevent generating flashcards for the same content multiple times.
   * 
   * @param text - The source educational text
   * @returns MD5 hash of the text
   */
  private static async generateHash(text: string): Promise<string> {
    return createHash("md5").update(text).digest("hex");
  }

  /**
   * Checks if a successful generation already exists for this user and hash.
   * 
   * @param supabase - Supabase client instance
   * @param userId - ID of the user
   * @param hash - MD5 hash of the source text
   * @returns boolean indicating if a duplicate was found
   */
  private static async checkDuplicate(
    supabase: SupabaseClient,
    userId: string,
    hash: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("generations")
      .select("id")
      .eq("user_id", userId)
      .eq("source_text_hash", hash)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[GenerationService] Error checking duplicate:", error);
      return false;
    }

    return !!data;
  }

  /**
   * Logs an error related to the generation process to the database.
   * 
   * @param supabase - Supabase client instance
   * @param userId - ID of the user
   * @param errorData - Object containing error details
   */
  private static async logError(
    supabase: SupabaseClient,
    userId: string,
    errorData: {
      error_code: string;
      error_message: string;
      source_text_hash: string;
      source_text_length: number;
    }
  ): Promise<void> {
    const { error } = await supabase.from("generation_error_logs").insert({
      user_id: userId,
      error_code: errorData.error_code,
      error_message: errorData.error_message,
      model_name: this.MOCK_MODEL_NAME,
      source_text_hash: errorData.source_text_hash,
      source_text_length: errorData.source_text_length,
    });

    if (error) {
      console.error("[GenerationService] Failed to log error to DB:", error);
    }
  }

  /**
   * Main service method to generate flashcard proposals from source text.
   * 
   * Steps:
   * 1. Check for duplicates using MD5 hash.
   * 2. Create an initial generation record in DB.
   * 3. Call AI model (mocked) to get proposals.
   * 4. Update the DB record with the results.
   * 5. Handle and log any errors that occur during the process.
   * 
   * @param supabase - Supabase client instance from context.locals
   * @param command - Object containing the source text
   * @throws ApiError if validation fails, duplicate is found, or DB/AI error occurs
   * @returns GenerationResponseDTO containing proposals and metadata
   */
  public static async generateFlashcards(
    supabase: SupabaseClient,
    command: GenerateFlashcardsCommand
  ): Promise<GenerationResponseDTO> {
    const userId = DEFAULT_USER_ID;
    const sourceText = command.source_text;
    const sourceTextLength = sourceText.length;
    const sourceTextHash = await this.generateHash(sourceText);

    // 1. Deduplication check
    const isDuplicate = await this.checkDuplicate(supabase, userId, sourceTextHash);
    if (isDuplicate) {
      const error: ApiError = {
        code: "DUPLICATE_GENERATION",
        message: "Ten tekst został już przetworzony.",
      };
      throw error;
    }

    // 2. Create generation record
    const { data: generation, error: dbError } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        model_name: this.MOCK_MODEL_NAME,
        count_generated: 0,
        count_accepted_edited: 0,
        count_accepted_unedited: 0,
      })
      .select()
      .single();

    if (dbError || !generation) {
      await this.logError(supabase, userId, {
        error_code: "DB_ERROR",
        error_message: dbError?.message || "Failed to create generation record",
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
      });
      throw {
        code: "DB_ERROR",
        message: "Błąd podczas zapisu do bazy danych.",
      } as ApiError;
    }

    try {
      // 3. Mock LLM Logic
      console.log(`[GenerationService] Starting mock generation for user ${userId}, hash ${sourceTextHash}`);
      
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate potential timeout/error (10% chance for 503)
      if (Math.random() < 0.1) {
        console.warn(`[GenerationService] Simulated mock timeout for hash ${sourceTextHash}`);
        throw {
          code: "MOCK_TIMEOUT",
          message: "Serwis czasowo niedostępny (symulacja).",
        } as ApiError;
      }

      // Generate mock proposals based on length
      const countToGenerate = Math.min(Math.floor(sourceTextLength / 500), 10) || 3;
      const proposals: GenerationProposalDTO[] = Array.from({ length: countToGenerate }).map((_, i) => ({
        proposal_id: `temp-${i + 1}`,
        front: `Pytanie ${i + 1} dotyczące tekstu (${sourceTextHash.slice(0, 8)})`,
        back: `Odpowiedź ${i + 1} wygenerowana przez AI na podstawie dostarczonej treści.`,
      }));

      // 4. Update generation record with success
      const { error: updateError } = await supabase
        .from("generations")
        .update({ count_generated: proposals.length })
        .eq("id", generation.id);

      if (updateError) {
        console.error(`[GenerationService] Error updating generation count for ${generation.id}:`, updateError);
        // We don't throw here as the generation actually succeeded in producing proposals
      }

      console.log(`[GenerationService] Successfully generated ${proposals.length} proposals for ${generation.id}`);

      return {
        generation_id: generation.id,
        proposals,
        metadata: {
          model_name: this.MOCK_MODEL_NAME,
          source_text_length: sourceTextLength,
          count_generated: proposals.length,
        },
      };
    } catch (err: any) {
      console.error(`[GenerationService] Critical error during generation:`, err);
      const apiError = err as ApiError;
      await this.logError(supabase, userId, {
        error_code: apiError.code || "AI_GENERATION_ERROR",
        error_message: apiError.message || "Błąd podczas generowania fiszek.",
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
      });
      throw apiError;
    }
  }
}
