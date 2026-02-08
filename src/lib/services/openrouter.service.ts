import type { CompletionParams, OpenRouterRequest, OpenRouterResponse } from "../../types";

/**
 * Constants for OpenRouter flashcard generation
 * Based on the implementation plan (Krok 2)
 */

export const FLASHCARD_SYSTEM_PROMPT = `Jesteś doświadczonym nauczycielem i ekspertem od metod efektywnej nauki (spaced repetition). 
Twoim zadaniem jest przekształcenie dostarczonego tekstu źródłowego w zestaw wysokiej jakości fiszek.

Zasady tworzenia fiszek:
- Każda fiszka musi być parą pytanie-odpowiedź.
- Pytania (front) muszą być konkretne i krótkie (max 200 znaków).
- Odpowiedzi (back) muszą być wyczerpujące, ale zwięzłe (max 500 znaków).
- Skup się na kluczowych pojęciach, definicjach i faktach.
- Unikaj pytań wielokrotnego wyboru.
- Odpowiadaj w języku, w którym dostarczono tekst źródłowy.`;

export const FLASHCARD_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    proposals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: {
            type: "string",
            description: "Pytanie lub pojęcie (max 200 znaków)",
            maxLength: 200,
          },
          back: {
            type: "string",
            description: "Odpowiedź lub definicja (max 500 znaków)",
            maxLength: 500,
          },
        },
        required: ["front", "back"],
        additionalProperties: false,
      },
    },
  },
  required: ["proposals"],
  additionalProperties: false,
};

/**
 * Service to interact with OpenRouter API
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string = "https://openrouter.ai/api/v1";
  private readonly defaultModel: string;

  constructor(config?: { model?: string }) {
    // In Cloudflare Pages, environment variables are injected at build time
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;
    this.defaultModel = config?.model || "openai/gpt-4o-mini";

    if (!this.apiKey) {
      throw new Error(
        "Missing OPENROUTER_API_KEY in environment variables. " +
          "Make sure it's set in Cloudflare Pages Dashboard (Settings > Environment variables > Production)"
      );
    }
  }

  /**
   * Main method to generate chat completion with structured output
   */
  async generateChatCompletion<T>(params: CompletionParams): Promise<T> {
    const payload = this.buildRequestPayload(params);
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        const response = await this.executeRequest(payload);
        const data = await this.handleApiResponse(response);

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("Empty response from OpenRouter");
        }

        try {
          return JSON.parse(content) as T;
        } catch {
          // eslint-disable-next-line no-console
          console.error("[OpenRouterService] Failed to parse response as JSON:", content);
          throw new Error("Validation Error: Model returned invalid JSON format");
        }
      } catch (error: unknown) {
        const err = error as Error;
        // Handle rate limiting with exponential backoff
        if (err.message.includes("429") && retryCount < maxRetries) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000;
          // eslint-disable-next-line no-console
          console.warn(
            `[OpenRouterService] Rate limit hit. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Log and rethrow other errors
        // eslint-disable-next-line no-console
        console.error("[OpenRouterService] Error during chat completion:", err.message);
        throw err;
      }
    }

    throw new Error("Max retries exceeded for OpenRouter request");
  }

  /**
   * Formats the request payload for OpenRouter
   */
  private buildRequestPayload(params: CompletionParams): OpenRouterRequest {
    return {
      model: params.model || this.defaultModel,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "flashcard_generation",
          strict: true,
          schema: params.responseSchema,
        },
      },
      temperature: params.temperature ?? 0.3,
      max_tokens: 6000,
      top_p: 1,
    };
  }

  /**
   * Executes the fetch request to OpenRouter
   */
  private async executeRequest(payload: OpenRouterRequest): Promise<Response> {
    return fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://10x-flashcard-builder.vercel.app", // Fallback for OpenRouter tracking
        "X-Title": "10x Flashcard Builder",
      },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Handles API response status and parsing
   */
  private async handleApiResponse(response: Response): Promise<OpenRouterResponse> {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: { message: response.statusText } };
      }

      const status = response.status;
      const message = errorData.error?.message || response.statusText;

      // Specialized error handling based on status codes
      if (status === 401) {
        throw new Error(`401 Unauthorized: Invalid API Key. ${message}`);
      }
      if (status === 402) {
        throw new Error(`402 Payment Required: Insufficient funds in OpenRouter account. ${message}`);
      }
      if (status === 429) {
        throw new Error(`429 Too Many Requests: Rate limit exceeded. ${message}`);
      }
      if (status >= 500) {
        throw new Error(`${status} Provider Error: OpenRouter or model provider issue. ${message}`);
      }

      throw new Error(`OpenRouter API Error (${status}): ${message}`);
    }

    return response.json();
  }
}
