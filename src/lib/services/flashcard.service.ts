import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateFlashcardCommand,
  FlashcardDTO,
  ApiError,
  PaginatedData,
  UpdateFlashcardCommand,
  FlashcardSourceType,
} from "../../types";

/**
 * Service responsible for managing flashcard operations.
 * Handles creation, bulk operations, and synchronization with generation stats.
 */
export const FlashcardService = {
  /**
   * Retrieves a paginated list of flashcards with optional filtering.
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user
   * @param options - Filtering and pagination options
   * @returns Paginated list of FlashcardDTOs
   */
  getFlashcards: async (
    supabase: SupabaseClient,
    userId: string,
    options: {
      page?: number;
      limit?: number;
      source?: FlashcardSourceType;
      sort?: "created_at" | "updated_at";
      order?: "asc" | "desc";
    }
  ): Promise<PaginatedData<FlashcardDTO>> => {
    const { page = 1, limit = 50, source, sort = "created_at", order = "desc" } = options;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", userId);

    if (source) {
      query = query.eq("source", source);
    }

    if (sort === "random") {
      // Supabase/PostgreSQL doesn't have a direct 'random' sort in the client
      // We will use a raw SQL approach or just fetch and shuffle if the limit is small
      // For the learning session, we want 12 random cards.
      // A common trick is to use an rpc or just fetch more and shuffle.
      // But for simplicity and matching the plan, we can use the 'random' sort if we had an RPC.
      // Without an RPC, let's fetch with a larger limit and shuffle, or just use the default sort
      // and shuffle on the client side since the plan says:
      // "utilizing the fact that with no specified sorting and limit, the database returns data in a nearly random way"
      // Wait, the plan actually says we should add support for sort=random.
      // Let's use the PostgreSQL random() function via a trick or just fetch and shuffle.
      // Actually, we can use .order('random' as any) if we have a view or function, 
      // but the simplest way to get random cards in Supabase without RPC is not straightforward.
      // Let's stick to the plan's suggestion of "default sort being nearly random" or implement a simple shuffle.
    }

    const { data, count, error } =
      sort === "random"
        ? await query.limit(limit) // fetch without specific order
        : await query.order(sort as "created_at" | "updated_at", { ascending: order === "asc" }).range(from, to);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[FlashcardService] Error fetching flashcards:", error);
      throw {
        code: "DB_FETCH_ERROR",
        message: "Błąd podczas pobierania fiszek z bazy danych.",
        details: error,
      } as ApiError;
    }

    const total = count || 0;
    const total_pages = Math.ceil(total / limit);

    return {
      items: (data as FlashcardDTO[]) || [],
      pagination: {
        total,
        page,
        limit,
        total_pages,
      },
    };
  },

  /**
   * Retrieves a single flashcard by its ID.
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user (for ownership check)
   * @param id - UUID of the flashcard
   * @returns FlashcardDTO
   * @throws ApiError if flashcard not found or access denied
   */
  getFlashcardById: async (supabase: SupabaseClient, userId: string, id: string): Promise<FlashcardDTO> => {
    const { data, error } = await supabase.from("flashcards").select("*").eq("id", id).eq("user_id", userId).single();

    if (error || !data) {
      // eslint-disable-next-line no-console
      console.error(`[FlashcardService] Error fetching flashcard ${id}:`, error);
      throw {
        code: "NOT_FOUND",
        message: "Fiszka nie istnieje lub nie masz do niej uprawnień.",
      } as ApiError;
    }

    return data as FlashcardDTO;
  },

  /**
   * Updates an existing flashcard and syncs generation stats if needed.
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user
   * @param id - UUID of the flashcard
   * @param command - Update data
   * @returns Updated FlashcardDTO
   */
  updateFlashcard: async (
    supabase: SupabaseClient,
    userId: string,
    id: string,
    command: UpdateFlashcardCommand
  ): Promise<FlashcardDTO> => {
    // 1. Fetch current flashcard to check rules
    const current = await FlashcardService.getFlashcardById(supabase, userId, id);

    // 2. Business Logic: Source transitions
    let newSource = command.source || current.source;

    // Rule: Cannot change manual to AI
    if (current.source === "manual" && (newSource === "ai-full" || newSource === "ai-edited")) {
      throw {
        code: "INVALID_SOURCE_TRANSITION",
        message: "Nie można zmienić źródła fiszki ręcznej na AI.",
      } as ApiError;
    }

    // Rule: Auto-transition ai-full -> ai-edited if content changed
    const contentChanged =
      (command.front !== undefined && command.front !== current.front) ||
      (command.back !== undefined && command.back !== current.back);

    if (current.source === "ai-full" && contentChanged && newSource === "ai-full") {
      newSource = "ai-edited";
    }

    // 3. Perform update
    const { data, error } = await supabase
      .from("flashcards")
      .update({
        front: command.front,
        back: command.back,
        source: newSource,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error(`[FlashcardService] Error updating flashcard ${id}:`, error);
      throw {
        code: "DB_UPDATE_ERROR",
        message: "Błąd podczas aktualizacji fiszki.",
        details: error,
      } as ApiError;
    }

    const updated = data as FlashcardDTO;

    // 4. Update generation stats if source changed from ai-full to ai-edited
    if (current.source === "ai-full" && updated.source === "ai-edited" && current.generation_id) {
      await FlashcardService.syncGenerationStatsOnEdit(supabase, userId, current.generation_id);
    }

    return updated;
  },

  /**
   * Deletes a flashcard and updates generation stats if it was an AI flashcard.
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user
   * @param id - UUID of the flashcard
   */
  deleteFlashcard: async (supabase: SupabaseClient, userId: string, id: string): Promise<void> => {
    // 1. Fetch to know if we need to update stats
    const current = await FlashcardService.getFlashcardById(supabase, userId, id);

    // 2. Delete the flashcard
    const { error } = await supabase.from("flashcards").delete().eq("id", id).eq("user_id", userId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error(`[FlashcardService] Error deleting flashcard ${id}:`, error);
      throw {
        code: "DB_DELETE_ERROR",
        message: "Błąd podczas usuwania fiszki.",
        details: error,
      } as ApiError;
    }

    // 3. Update generation stats if it was an AI flashcard
    if ((current.source === "ai-full" || current.source === "ai-edited") && current.generation_id) {
      await FlashcardService.syncGenerationStatsOnDelete(supabase, userId, current.generation_id, current.source);
    }
  },

  /**
   * Adjusts stats when an ai-full flashcard is edited to ai-edited.
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user
   * @param generationId - UUID of the generation session
   */
  syncGenerationStatsOnEdit: async (supabase: SupabaseClient, userId: string, generationId: string): Promise<void> => {
    const { data: gen, error: fetchError } = await supabase
      .from("generations")
      .select("count_accepted_unedited, count_accepted_edited")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !gen) return;

    await supabase
      .from("generations")
      .update({
        count_accepted_unedited: Math.max(0, (gen.count_accepted_unedited || 0) - 1),
        count_accepted_edited: (gen.count_accepted_edited || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", generationId);
  },

  /**
   * Adjusts stats when an AI flashcard is deleted.
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user
   * @param generationId - UUID of the generation session
   * @param source - Original source of the flashcard to determine which counter to decrement
   */
  syncGenerationStatsOnDelete: async (
    supabase: SupabaseClient,
    userId: string,
    generationId: string,
    source: "ai-full" | "ai-edited"
  ): Promise<void> => {
    const { data: gen, error: fetchError } = await supabase
      .from("generations")
      .select("count_accepted_unedited, count_accepted_edited")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !gen) return;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (source === "ai-full") {
      updates.count_accepted_unedited = Math.max(0, (gen.count_accepted_unedited || 0) - 1);
    } else {
      updates.count_accepted_edited = Math.max(0, (gen.count_accepted_edited || 0) - 1);
    }

    await supabase.from("generations").update(updates).eq("id", generationId);
  },

  /**
   * Creates one or more flashcards and updates generation statistics if applicable.
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user creating the flashcards
   * @param commands - Single flashcard data or an array of flashcard data
   * @returns Array of created FlashcardDTOs
   * @throws ApiError if database insertion fails
   */
  createFlashcards: async (
    supabase: SupabaseClient,
    userId: string,
    commands: CreateFlashcardCommand | CreateFlashcardCommand[]
  ): Promise<FlashcardDTO[]> => {
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
    const { data, error } = await supabase.from("flashcards").insert(flashcardsToInsert).select();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[FlashcardService] Error inserting flashcards:", error);
      throw {
        code: "DB_INSERT_ERROR",
        message: "Błąd podczas zapisywania fiszek w bazie danych.",
        details: error,
      } as ApiError;
    }

    // 3. Update generation stats if flashcards originated from AI
    await FlashcardService.updateGenerationStats(supabase, userId, commandsArray);

    return data as FlashcardDTO[];
  },

  /**
   * Updates the accepted counts in the generations table.
   * This is triggered when AI-generated flashcards are saved.
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user
   * @param commands - Array of flashcard creation commands
   */
  updateGenerationStats: async (
    supabase: SupabaseClient,
    userId: string,
    commands: CreateFlashcardCommand[]
  ): Promise<void> => {
    const aiCommands = commands.filter(
      (cmd) => (cmd.source === "ai-full" || cmd.source === "ai-edited") && cmd.generation_id
    );

    if (aiCommands.length === 0) return;

    // Group updates by generation_id to minimize database calls
    const statsByGeneration: Record<string, { unedited: number; edited: number }> = {};

    for (const cmd of aiCommands) {
      const genId = cmd.generation_id;
      if (!genId) continue;
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
        // eslint-disable-next-line no-console
        console.warn(
          `[FlashcardService] Generation ${genId} not found or not owned by user ${userId}. Skipping stats update.`
        );
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
        // eslint-disable-next-line no-console
        console.error(`[FlashcardService] Failed to update stats for generation ${genId}:`, updateError);
      }
    }
  },
};
