# API Endpoint Implementation Plan: POST /api/generations

## 1. Przegląd punktu końcowego

Endpoint umożliwia automatyczne generowanie propozycji fiszek (front/back) na podstawie dostarczonego tekstu źródłowego. Na obecnym etapie wdrożenia system wykorzystuje **mocka serwisu AI**, symulując komunikację z modelem LLM (docelowo OpenRouter). Proces jest monitorowany, a statystyki i błędy są zapisywane w bazie danych Supabase. Wygenerowane propozycje są zwracane klientowi jako dane tymczasowe do dalszej akceptacji.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/generations`
- **Parametry**:
  - **Wymagane**:
    - `source_text` (string): Zawartość edukacyjna, na podstawie której mają powstać fiszki. Długość: 1000 - 10000 znaków.
- **Request Body**:

```json
{
  "source_text": "Treść o długości od 1000 do 10000 znaków..."
}
```

## 3. Wykorzystywane typy

- `GenerateFlashcardsCommand` (src/types.ts)
- `GenerationResponseDTO` (src/types.ts)
- `GenerationProposalDTO` (src/types.ts)
- `ApiResponse<GenerationResponseDTO>` (src/types.ts)

## 4. Szczegóły odpowiedzi

- **200 OK**: Sukces generowania (na tym etapie zwraca zmockowane dane).

```json
{
  "success": true,
  "data": {
    "generation_id": "uuid",
    "proposals": [{ "proposal_id": "temp-1", "front": "...", "back": "..." }],
    "metadata": {
      "model_name": "mock-gemini-3-flash",
      "source_text_length": 5000,
      "count_generated": 10
    }
  }
}
```

- **400 Bad Request**: Walidacja (długość tekstu) lub duplikacja (ten sam hash).
- **401 Unauthorized**: Brak autoryzacji (użytkownik niezalogowany).
- **500 Internal Server Error**: Błąd serwera lub błąd zapisu do bazy danych.
- **503 Service Unavailable**: Symulowany błąd niedostępności serwisu (w testach mocka).

## 5. Przepływ danych

1. **Astro Endpoint**: Odbiera żądanie, weryfikuje sesję użytkownika przez `locals.supabase`.
2. **Validation**: Zod sprawdza czy `source_text` mieści się w przedziale 1000-10000 znaków.
3. **GenerationService**:
   - Oblicza SHA-256 hash z `source_text`.
   - Sprawdza w tabeli `generations` czy istnieje już pomyślna sesja dla `user_id` + `source_text_hash` (deduplikacja).
   - Tworzy nowy rekord w tabeli `generations` z początkowymi licznikami = 0.
4. **Mock LLM Logic**:
   - Generuje zestaw predefiniowanych propozycji fiszek na podstawie długości tekstu.
   - Symuluje opóźnienie (np. 1-2s).
   - Parsuje dane na strukturę `GenerationProposalDTO[]`.
5. **Success/Error Flow**:
   - **Sukces**: Aktualizuje rekord `generations` ustawiając `count_generated`, zwraca dane do klienta.
   - **Błąd**: Przechwytuje wyjątek, zapisuje szczegóły błędu do `generation_error_logs`, rzuca błąd API do kontrolera.

## 6. Względy bezpieczeństwa

- **Autoryzacja**: Wszystkie operacje wymagają zalogowanego użytkownika (dostęp do `auth.uid()`).
- **Deduplikacja**: Unikalny indeks na `(user_id, source_text_hash)` chroni przed nadmiarowym generowaniem tych samych danych.
- **RLS**: Supabase Row Level Security zapewnia, że użytkownik widzi tylko swoje rekordy.

## 7. Obsługa błędów

| Kod błędu              | Status | Opis                               | Logowanie do DB |
| :--------------------- | :----- | :--------------------------------- | :-------------- |
| `VALIDATION_ERROR`     | 400    | Zbyt krótki/długi tekst            | Nie             |
| `DUPLICATE_GENERATION` | 400    | Tekst został już przetworzony      | Nie             |
| `MOCK_TIMEOUT`         | 503    | Symulowany timeout mocka           | Tak             |
| `DB_ERROR`             | 500    | Błąd podczas zapisu do bazy danych | Tak             |

## 8. Rozważania dotyczące wydajności

- **Deduplikacja**: Szybkie sprawdzenie hashu w indeksowanej kolumnie bazy danych przed logiką generowania.
- **Asynchroniczność**: Wykorzystanie `async/await` dla operacji I/O (DB, mock AI).

## 9. Etapy wdrożenia

1. **Utworzenie pliku endpointu**: Utworzenie `src/pages/api/generations.ts` (lub `src/pages/api/generations/index.ts`).
2. **Implementacja walidacji**: Użycie biblioteki `zod` do weryfikacji struktury i długości `source_text`.
3. **Stworzenie serwisu `GenerationService`**:
   - Implementacja w `src/lib/services/generation.service.ts`.
   - Integracja z mockiem serwisu AI zwracającym statyczne dane.
   - Obsługa logiki zapisu do tabeli `generations` oraz rejestracji błędów w `generation_error_logs`.
4. **Zabezpieczenie endpointu**: Dodanie mechanizmu uwierzytelniania poprzez Supabase Auth.
5. **Implementacja logiki endpointu**: Połączenie walidacji, uwierzytelniania i serwisu w ramach handlera `POST`.
6. **Logowanie i audyt**: Dodanie szczegółowego logowania akcji i błędów do konsoli oraz bazy danych.
