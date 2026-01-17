import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateFlashcardCommand, FlashcardDTO, ApiError } from "../../types";

/**
 * Service responsible for managing flashcard operations.
 * Handles creation, bulk operations, and synchronization with generation stats.
 */
export class FlashcardService {
  /**
   * Creates one or more flashcards and updates generation statistics if applicable.
   * 
   * @param supabase - Supabase client instance
   * @param userId - ID of the user creating the flashcards
   * @param commands - Single flashcard data or an array of flashcard data
   * @returns Array of created FlashcardDTOs
   * @throws ApiError if database insertion fails
   */
  public static async createFlashcards(
    supabase: SupabaseClient,
    userId: string,
    commands: CreateFlashcardCommand | CreateFlashcardCommand[]
  ): Promise<FlashcardDTO[]> {
    const commandsArray = Array.isArray(commands) ? commands : [commands];

    if (commandsArray.length === 0) {
      return [];
    }

    // 1. Prepare data for insertion
    const flashcardsToInsert = commandsArray.map((cmd) => ({
      ...cmd,
      user_id: userId,
    }));

    // 2. Insert flashcards into database
    const { data, error } = await supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select();

    if (error) {
      console.error("[FlashcardService] Error inserting flashcards:", error);
      throw {
        code: "DB_INSERT_ERROR",
        message: "Błąd podczas zapisywania fiszek w bazie danych.",
        details: error,
      } as ApiError;
    }

    // 3. Update generation stats if flashcards originated from AI
    await this.updateGenerationStats(supabase, userId, commandsArray);

    return data as FlashcardDTO[];
  }

  /**
   * Updates the accepted counts in the generations table.
   * This is triggered when AI-generated flashcards are saved.
   * 
   * @param supabase - Supabase client instance
   * @param userId - ID of the user
   * @param commands - Array of flashcard creation commands
   */
  private static async updateGenerationStats(
    supabase: SupabaseClient,
    userId: string,
    commands: CreateFlashcardCommand[]
  ): Promise<void> {
    const aiCommands = commands.filter(
      (cmd) => (cmd.source === "ai-full" || cmd.source === "ai-edited") && cmd.generation_id
    );

    if (aiCommands.length === 0) return;

    // Group updates by generation_id to minimize database calls
    const statsByGeneration: Record<string, { unedited: number; edited: number }> = {};

    for (const cmd of aiCommands) {
      const genId = cmd.generation_id!;
      if (!statsByGeneration[genId]) {
        statsByGeneration[genId] = { unedited: 0, edited: 0 };
      }
      if (cmd.source === "ai-full") {
        statsByGeneration[genId].unedited++;
      } else if (cmd.source === "ai-edited") {
        statsByGeneration[genId].edited++;
      }
    }

    // Update each generation's counters
    for (const [genId, stats] of Object.entries(statsByGeneration)) {
      // Verify ownership and get current counts
      const { data: generation, error: fetchError } = await supabase
        .from("generations")
        .select("id, count_accepted_unedited, count_accepted_edited")
        .eq("id", genId)
        .eq("user_id", userId)
        .single();

      if (fetchError || !generation) {
        console.warn(`[FlashcardService] Generation ${genId} not found or not owned by user ${userId}. Skipping stats update.`);
        continue;
      }

      const { error: updateError } = await supabase
        .from("generations")
        .update({
          count_accepted_unedited: (generation.count_accepted_unedited || 0) + stats.unedited,
          count_accepted_edited: (generation.count_accepted_edited || 0) + stats.edited,
          updated_at: new Date().toISOString(),
        })
        .eq("id", genId);

      if (updateError) {
        console.error(`[FlashcardService] Failed to update stats for generation ${genId}:`, updateError);
      }
    }
  }
}
