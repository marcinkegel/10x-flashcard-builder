# Plan implementacji usługi OpenRouter

Niniejszy dokument opisuje szczegółowy plan wdrożenia usługi `OpenRouterService`, która będzie odpowiedzialna za komunikację z interfejsem API OpenRouter w celu generowania fiszek na podstawie dostarczonych treści edukacyjnych.

## 1. Opis usługi

Usługa `OpenRouterService` stanowi warstwę abstrakcji nad API OpenRouter. Jej głównym zadaniem jest wysyłanie zapytań do modeli językowych (LLM), obsługa ustrukturyzowanych odpowiedzi (JSON Schema) oraz zapewnienie odporności na błędy komunikacji. Usługa będzie wykorzystywana głównie przez `GenerationService` do zastąpienia obecnej logiki typu "mock".

## 2. Opis konstruktora

Serwis będzie implementowany jako klasa w `src/lib/services/openrouter.service.ts`.

```typescript
class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string = "https://openrouter.ai/api/v1";
  private readonly defaultModel: string;

  constructor(config?: { model?: string }) {
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;
    this.defaultModel = config?.model || "openai/gpt-4o-mini";

    if (!this.apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY in environment variables");
    }
  }
}
```

## 3. Publiczne metody i pola

### `generateChatCompletion<T>(params: CompletionParams): Promise<T>`

Główna metoda do wysyłania zapytań.

- **Parametry**:
  - `systemPrompt`: Instrukcje systemowe definiujące zachowanie modelu.
  - `userPrompt`: Treść od użytkownika (np. tekst do przetworzenia).
  - `responseSchema`: Obiekt schematu JSON dla ustrukturyzowanej odpowiedzi.
  - `model?`: Opcjonalne nadpisanie domyślnego modelu.
  - `temperature?`: Parametr kreatywności (domyślnie 0.3 dla stabilnych wyników).
- **Zwraca**: Przetworzony obiekt typu `T` zgodny ze schematem.

## 4. Prywatne metody i pola

### `buildRequestPayload(params: CompletionParams): object`

Formatuje dane do formatu wymaganego przez OpenRouter API, w tym obsługę `response_format`.

### `executeRequest(payload: object): Promise<Response>`

Wykonuje faktyczne zapytanie `fetch` z odpowiednimi nagłówkami (`Authorization`, `HTTP-Referer`, `X-Title`).

### `handleApiResponse(response: Response): Promise<any>`

Analizuje status HTTP i parsuje odpowiedź. Rzuca dedykowane błędy w przypadku niepowodzenia.

## 5. Obsługa błędów

Serwis musi obsługiwać następujące scenariusze błędów:

1.  **401 Unauthorized**: Błędny klucz API.
2.  **402 Payment Required**: Brak środków na koncie OpenRouter.
3.  **429 Too Many Requests**: Przekroczenie limitów (rate limiting). Wymaga implementacji prostego retry z wykładniczym czasem oczekiwania.
4.  **500/502/503 Provider Error**: Błąd po stronie dostawcy modelu (np. OpenAI/Anthropic).
5.  **Validation Error**: Model zwrócił JSON, który nie jest zgodny z przesłanym `responseSchema`.

## 6. Kwestie bezpieczeństwa

- **Klucze API**: Nigdy nie eksponuj `OPENROUTER_API_KEY` w kodzie frontendowym. Usługa musi być wywoływana wyłącznie w środowisku serwerowym (Astro API Routes / Server Actions).
- **Zmienne środowiskowe**: Użyj `import.meta.env` (Astro) do bezpiecznego dostępu do sekretów.

## 7. Plan wdrożenia krok po kroku

### Krok 1: Konfiguracja środowiska

1.  Zdefiniuj typy dla OpenRouter w `src/types.ts` (np. `OpenRouterRequest`, `OpenRouterResponse`).

### Krok 2: Implementacja ustrukturyzowanego formatu odpowiedzi i przykładów parametrów

Poniżej znajdują się konkretne przykłady implementacji kluczowych parametrów OpenRouter API, dostosowane do wymagań PRD (limity znaków: 200 dla przodu, 500 dla tyłu):

1. **Komunikat systemowy (System Message)**:
   Definiuje rolę eksperta edukacyjnego i narzuca rygorystyczne zasady tworzenia fiszek.

   ```typescript
   const systemPrompt = `Jesteś doświadczonym nauczycielem i ekspertem od metod efektywnej nauki (spaced repetition). 
   Twoim zadaniem jest przekształcenie dostarczonego tekstu źródłowego w zestaw wysokiej jakości fiszek.
   
   Zasady tworzenia fiszek:
   - Każda fiszka musi być parą pytanie-odpowiedź.
   - Pytania (front) muszą być konkretne i krótkie (max 200 znaków).
   - Odpowiedzi (back) muszą być wyczerpujące, ale zwięzłe (max 500 znaków).
   - Skup się na kluczowych pojęciach, definicjach i faktach.
   - Unikaj pytań wielokrotnego wyboru.
   - Odpowiadaj w języku, w którym dostarczono tekst źródłowy.`;
   ```

2. **Komunikat użytkownika (User Message)**:
   Zawiera dane wejściowe do przetworzenia. Zgodnie z PRD, tekst wejściowy ma od 1 000 do 10 000 znaków.

   ```typescript
   const userPrompt = `Przeanalizuj poniższy materiał edukacyjny i wygeneruj na jego podstawie propozycje fiszek:\n\n${sourceText}`;
   ```

3. **Ustrukturyzowane odpowiedzi (response_format)**:
   Wymusza na modelu zwrócenie poprawnego obiektu JSON z uwzględnieniem limitów znaków z PRD.

   ```typescript
   const responseFormat = {
     type: "json_schema",
     json_schema: {
       name: "flashcard_generation",
       strict: true,
       schema: {
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
       },
     },
   };
   ```

4. **Nazwa modelu i parametry (Model & Parameters)**:
   ```typescript
   const payload = {
     model: "openai/gpt-4o-mini",
     messages: [
       { role: "system", content: systemPrompt },
       { role: "user", content: userPrompt },
     ],
     response_format: responseFormat,
     temperature: 0.3, // Niska temperatura zapewnia wysoką jakość i powtarzalność
     max_tokens: 6000,
     top_p: 1,
   };
   ```

### Krok 3: Implementacja klasy OpenRouterService

Stwórz plik `src/lib/services/openrouter.service.ts` i zaimplementuj metody opisane w punktach 3 i 4. Pamiętaj o ustawieniu nagłówków `HTTP-Referer` i `X-Title` dla lepszego rankingu w OpenRouter.

### Krok 4: Integracja z GenerationService

Zastąp mockowe dane w `src/lib/services/generation.service.ts` wywołaniem nowej usługi:

```typescript
// Przykład integracji
const openRouter = new OpenRouterService();
const result = await openRouter.generateChatCompletion<GenerationResult>({
  systemPrompt: "Jesteś ekspertem edukacyjnym. Twórz zwięzłe fiszki.",
  userPrompt: sourceText,
  responseSchema: FLASHCARD_JSON_SCHEMA,
});
```

### Krok 5: Testy i walidacja

1.  Przetestuj obsługę błędów (np. symulując błędny klucz).
2.  Sprawdź poprawność parsowania ustrukturyzowanych danych dla różnych długości tekstów źródłowych.
3.  Upewnij się, że `GenerationService` poprawnie loguje błędy z OpenRouter do bazy danych Supabase.
