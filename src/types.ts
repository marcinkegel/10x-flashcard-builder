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
  details?: unknown;
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
export type CreateFlashcardCommand = Pick<TablesInsert<"flashcards">, "front" | "back" | "source" | "generation_id">;

/**
 * Model polecenia dla aktualizacji istniejącej fiszki.
 * Zgodnie z planem API, użytkownik może edytować treść frontu i tyłu.
 * Pole 'source' jest opcjonalne, aby umożliwić zmianę statusu ('ai-full' -> 'ai-edited').
 
 */
export type UpdateFlashcardCommand = Pick<TablesUpdate<"flashcards">, "front" | "back" | "source">;

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
 * Rozszerzony model reprezentujący stan propozycji fiszki w UI.
 * Umożliwia dynamiczne zarządzanie stanem akceptacji i edycji przed zapisem do DB.
 */
export interface FlashcardProposalViewModel {
  id: string; // Mapowane z proposal_id
  front: string;
  back: string;
  source: "ai-full" | "ai-edited";
  status: "pending" | "accepted" | "rejected";
  isEditing: boolean;
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
 * OPENROUTER API
 */

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: object;
  };
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  response_format?: OpenRouterResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    code: number;
    metadata?: unknown;
  };
}

export interface CompletionParams {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: object;
  model?: string;
  temperature?: number;
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
