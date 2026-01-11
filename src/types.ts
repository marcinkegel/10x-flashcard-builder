import type { Database, Tables, TablesInsert, TablesUpdate } from "./db/database.types";

/**
 * GENERIC API RESPONSES
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
}

export interface PaginationDTO {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationDTO;
}

/**
 * FLASHCARDS
 */

/**
 * DTO reprezentujący fiszkę zwracaną przez API.
 * Mapuje bezpośrednio strukturę wiersza z tabeli 'flashcards'.
 */
export type FlashcardDTO = Tables<"flashcards">;

/**
 * Model polecenia dla tworzenia nowej fiszki (manualnie lub z AI).
 * Wybieramy kluczowe pola z TableInsert, upewniając się, że spełniamy wymagania walidacji API.
 */
export type CreateFlashcardCommand = Pick<
  TablesInsert<"flashcards">,
  "front" | "back" | "source" | "generation_id"
>;

/**
 * Model polecenia dla aktualizacji istniejącej fiszki.
 * Zgodnie z planem API, użytkownik może edytować tylko treść frontu i tyłu.
 */
export type UpdateFlashcardCommand = Pick<
  TablesUpdate<"flashcards">,
  "front" | "back"
>;

/**
 * AI GENERATION
 */

/**
 * DTO reprezentujący sesję generowania fiszek.
 */
export type GenerationDTO = Tables<"generations">;

/**
 * Model polecenia do rozpoczęcia procesu generowania przez LLM.
 * Pole 'source_text' nie jest trwale zapisywane w tej formie w DB (tylko hash/długość).
 */
export interface GenerateFlashcardsCommand {
  source_text: string;
}

/**
 * Propozycja fiszki wygenerowana przez AI, która nie została jeszcze zapisana w DB.
 */
export interface GenerationProposalDTO {
  proposal_id: string; // tymczasowy identyfikator dla UI
  front: string;
  back: string;
}

/**
 * Odpowiedź z endpointu generowania, zawierająca propozycje i metadane sesji.
 */
export interface GenerationResponseDTO {
  generation_id: string;
  proposals: GenerationProposalDTO[];
  metadata: {
    model_name: string;
    source_text_length: number;
    count_generated: number;
  };
}

/**
 * ERROR LOGGING
 */

/**
 * DTO reprezentujący log błędu generowania AI.
 */
export type GenerationErrorLogDTO = Tables<"generation_error_logs">;

/**
 * ENUMS & CONSTANTS
 */

export type FlashcardSourceType = Database["public"]["Enums"]["flashcard_source_type"];

