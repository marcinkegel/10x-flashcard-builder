import type { SupabaseClient } from "../../db/supabase.client";
import type { GenerateFlashcardsCommand, GenerationResponseDTO, GenerationProposalDTO, ApiError } from "../../types";
import { createHash } from "node:crypto";
import { OpenRouterService, FLASHCARD_SYSTEM_PROMPT, FLASHCARD_RESPONSE_SCHEMA } from "./openrouter.service";

/**
 * Service responsible for managing the flashcard generation process.
 * Handles deduplication, database logging, and coordination with AI models.
 */
const openRouter = new OpenRouterService();
const MODEL_NAME = "openai/gpt-4o-mini";

/**
 * Service responsible for managing the flashcard generation process.
 * Handles deduplication, database logging, and coordination with AI models.
 */
export const GenerationService = {
  /**
   * Generates an MD5 hash from the source text.
   * Used for deduplication to prevent generating flashcards for the same content multiple times.
   *
   * @param text - The source educational text
   * @returns MD5 hash of the text
   */
  generateHash: async (text: string): Promise<string> => {
    return createHash("md5").update(text).digest("hex");
  },

  /**
   * Checks if a successful generation already exists for this user and hash.
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user
   * @param hash - MD5 hash of the source text
   * @returns boolean indicating if a duplicate was found
   */
  checkDuplicate: async (supabase: SupabaseClient, userId: string, hash: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("generations")
      .select("id")
      .eq("user_id", userId)
      .eq("source_text_hash", hash)
      .limit(1)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[GenerationService] Error checking duplicate:", error);
      return false;
    }

    return !!data;
  },

  /**
   * Logs an error related to the generation process to the database.
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user
   * @param errorData - Object containing error details
   */
  logError: async (
    supabase: SupabaseClient,
    userId: string,
    errorData: {
      error_code: string;
      error_message: string;
      source_text_hash: string;
      source_text_length: number;
    }
  ): Promise<void> => {
    const { error } = await supabase.from("generation_error_logs").insert({
      user_id: userId,
      error_code: errorData.error_code,
      error_message: errorData.error_message,
      model_name: MODEL_NAME,
      source_text_hash: errorData.source_text_hash,
      source_text_length: errorData.source_text_length,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[GenerationService] Failed to log error to DB:", error);
    }
  },

  /**
   * Main service method to generate flashcard proposals from source text.
   *
   * Steps:
   * 1. Check for duplicates using MD5 hash.
   * 2. Create an initial generation record in DB.
   * 3. Call OpenRouter API to get proposals.
   * 4. Update the DB record with the results.
   * 5. Handle and log any errors that occur during the process.
   *
   * @param supabase - Supabase client instance from context.locals
   * @param userId - ID of the authenticated user
   * @param command - Object containing the source text
   * @throws ApiError if validation fails, duplicate is found, or DB/AI error occurs
   * @returns GenerationResponseDTO containing proposals and metadata
   */
  generateFlashcards: async (
    supabase: SupabaseClient,
    userId: string,
    command: GenerateFlashcardsCommand
  ): Promise<GenerationResponseDTO> => {
    const sourceText = command.source_text;
    const sourceTextLength = sourceText.length;
    const sourceTextHash = await GenerationService.generateHash(sourceText);

    // 1. Deduplication check
    const isDuplicate = await GenerationService.checkDuplicate(supabase, userId, sourceTextHash);
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
        model_name: MODEL_NAME,
        count_generated: 0,
        count_accepted_edited: 0,
        count_accepted_unedited: 0,
      })
      .select()
      .single();

    if (dbError || !generation) {
      await GenerationService.logError(supabase, userId, {
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
      // 3. Call OpenRouter
      // eslint-disable-next-line no-console

      const result = await openRouter.generateChatCompletion<{ proposals: GenerationProposalDTO[] }>({
        systemPrompt: FLASHCARD_SYSTEM_PROMPT,
        userPrompt: `Przeanalizuj poniższy materiał edukacyjny i wygeneruj na jego podstawie propozycje fiszek:\n\n${sourceText}`,
        responseSchema: FLASHCARD_RESPONSE_SCHEMA,
      });

      const proposals = result.proposals.map((p, i) => ({
        ...p,
        proposal_id: `ai-${generation.id.slice(0, 4)}-${i + 1}`,
      }));

      // 4. Update generation record with success
      const { error: updateError } = await supabase
        .from("generations")
        .update({ count_generated: proposals.length })
        .eq("id", generation.id);

      if (updateError) {
        // eslint-disable-next-line no-console
        console.error(`[GenerationService] Error updating generation count for ${generation.id}:`, updateError);
      }

      // eslint-disable-next-line no-console

      return {
        generation_id: generation.id,
        proposals,
        metadata: {
          model_name: MODEL_NAME,
          source_text_length: sourceTextLength,
          count_generated: proposals.length,
        },
      };
    } catch (err: unknown) {
      const errorObj = err as Error;
      // eslint-disable-next-line no-console
      console.error(`[GenerationService] Critical error during generation:`, errorObj);

      // Determine error code and message
      let errorCode = "AI_GENERATION_ERROR";
      const errorMessage = errorObj.message || "Błąd podczas generowania fiszek.";

      if (errorMessage.includes("401")) errorCode = "AI_AUTH_ERROR";
      if (errorMessage.includes("402")) errorCode = "AI_PAYMENT_ERROR";
      if (errorMessage.includes("429")) errorCode = "AI_RATE_LIMIT_ERROR";
      if (errorMessage.includes("Validation Error")) errorCode = "AI_VALIDATION_ERROR";

      await GenerationService.logError(supabase, userId, {
        error_code: errorCode,
        error_message: errorMessage,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
      });

      throw {
        code: errorCode,
        message: errorMessage,
      } as ApiError;
    }
  },
};
