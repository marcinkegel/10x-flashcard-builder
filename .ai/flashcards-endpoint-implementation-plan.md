# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Przegląd punktu końcowego
Endpoint `POST /api/flashcards` służy do tworzenia jednej lub wielu fiszek w ramach jednego żądania. Obsługuje zarówno fiszki tworzone ręcznie (`manual`), jak i te generowane przez AI (`ai-full`, `ai-edited`). W przypadku fiszek AI, endpoint automatycznie aktualizuje statystyki w tabeli `generations`. Cała operacja jest transakcyjna – albo wszystkie fiszki zostaną utworzone poprawnie, albo żadna.

## 2. Szczegóły żądania
- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards`
- **Uwierzytelnianie**: Wymagane (użytkownik musi być zalogowany)
- **Request Body**: Pojedynczy obiekt lub tablica obiektów o następującej strukturze:
  - `front`: string (wymagane, 1-200 znaków)
  - `back`: string (wymagane, 1-500 znaków)
  - `source`: enum (`ai-full`, `ai-edited`, `manual`) (wymagane)
  - `generation_id`: UUID (opcjonalne, wymagane jeśli `source` to `ai-full` lub `ai-edited`)

## 3. Wykorzystywane typy
- `CreateFlashcardCommand` (z `src/types.ts`): bazowy typ dla danych wejściowych.
- `FlashcardDTO` (z `src/types.ts`): typ zwracany po pomyślnym utworzeniu.
- `ApiResponse<FlashcardDTO[]>`: standardowy format odpowiedzi API.

## 4. Szczegóły odpowiedzi
- **211 Created**: Fiszki zostały utworzone pomyślnie.
  ```json
  {
    "success": true,
    "data": [...FlashcardDTO],
    "message": "Flashcard(s) created"
  }
  ```
- **400 Bad Request**: Błąd walidacji (np. przekroczona długość, brak wymaganych pól, nieprawidłowy `generation_id`).
- **401 Unauthorized**: Brak autoryzacji.
- **500 Internal Server Error**: Nieoczekiwany błąd serwera lub bazy danych.

## 5. Przepływ danych
1. **Endpoint Handler (`src/pages/api/flashcards.ts`)**:
   - Sprawdzenie autoryzacji (pobranie `user_id` z sesji).
   - Walidacja struktury body (Zod) – obsługa pojedynczego obiektu i tablicy.
   - Wywołanie `FlashcardService.createFlashcards`.
2. **FlashcardService (`src/lib/services/flashcard.service.ts`)**:
   - Rozpoczęcie transakcji w Supabase (jeśli biblioteka wspiera lub wykonanie atomowego `insert`).
   - Dla każdej fiszki z `generation_id`:
     - Weryfikacja czy `generation_id` należy do zalogowanego użytkownika.
     - Zliczenie typów (`ai-full` vs `ai-edited`).
   - Masowe wstawienie fiszek do tabeli `flashcards`.
   - Atomowa aktualizacja liczników `count_accepted_unedited` i `count_accepted_edited` w tabeli `generations` dla każdego unikalnego `generation_id`.
3. **Zwrócenie wyniku**:
   - Mapowanie utworzonych rekordów na `FlashcardDTO`.

## 6. Względy bezpieczeństwa
- **Autoryzacja**: Każde żądanie musi zawierać ważny token sesji.
- **Weryfikacja własności**: Serwis musi sprawdzić, czy podany `generation_id` należy do `user_id` wykonującego żądanie, aby zapobiec modyfikacji statystyk innych użytkowników.
- **Sanitacja**: Tekst `front` i `back` powinien być oczyszczony z potencjalnie niebezpiecznych tagów HTML/skryptów (trimming + podstawowa sanitacja).

## 7. Obsługa błędów
- `VALIDATION_ERROR` (400): Dane nie spełniają reguł (np. pusty tekst, nieprawidłowy enum).
- `MISSING_GENERATION_ID` (400): Źródło AI bez podanego `generation_id`.
- `INVALID_GENERATION_OWNER` (403/400): `generation_id` należy do innego użytkownika.
- `DB_TRANSACTION_ERROR` (500): Błąd podczas zapisu w bazie danych.

## 8. Rozważania dotyczące wydajności
- **Bulk Insert**: Użycie jednego zapytania `INSERT` dla wielu fiszek zamiast pętli z pojedynczymi zapytaniami.
- **Atomic Updates**: Użycie funkcji bazy danych (RPC) lub precyzyjnych zapytań `UPDATE` z inkrementacją, aby uniknąć problemów z zakleszczeniami (race conditions).

## 9. Etapy wdrożenia
1. **Model Walidacji**: Utworzenie schematu Zod w `src/pages/api/flashcards.ts` uwzględniającego reguły warunkowe dla `generation_id`.
2. **Serwis**: Utworzenie `src/lib/services/flashcard.service.ts` z metodą `createFlashcards`.
3. **Logika Inkrementacji**: Implementacja logiki aktualizacji liczników w `generations`.
4. **Endpoint**: Implementacja handlera `POST` w `src/pages/api/flashcards/index.ts`.
5. **Testy**: Weryfikacja poprawności zapisu dla różnych źródeł (`manual`, `ai-full`, `ai-edited`).
