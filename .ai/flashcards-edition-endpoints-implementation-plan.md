# API Endpoint Implementation Plan: Flashcards Management (CRUD)

Ten plan opisuje wdrożenie punktów końcowych API niezbędnych do przeglądania, edycji i usuwania fiszek, zgodnie ze specyfikacją projektu.

## 1. Przegląd punktu końcowego

Wdrożenie obejmuje cztery główne funkcjonalności:

- **Pobieranie listy fiszek**: Z obsługą paginacji i filtrowania.
- **Pobieranie szczegółów fiszki**: Dostęp do pojedynczego zasobu.
- **Aktualizacja fiszki**: Modyfikacja treści i zarządzanie statusem źródła (AI vs Manual).
- **Usuwanie fiszki**: Trwałe usunięcie zasobu.

## 2. Szczegóły żądania

### 2.1 GET /api/flashcards (Lista)

- **Metoda**: `GET`
- **URL**: `/api/flashcards`
- **Parametry (Query)**:
  - Opcjonalne:
    - `page` (number, default: 1)
    - `limit` (number, default: 50, max: 100)
    - `source` (enum: `ai-full`, `ai-edited`, `manual`)
    - `sort` (enum: `created_at`, `updated_at`, default: `created_at`)
    - `order` (enum: `asc`, `desc`, default: `desc`)

### 2.2 GET /api/flashcards/:id (Pojedyncza)

- **Metoda**: `GET`
- **URL**: `/api/flashcards/[id]`
- **Parametry**:
  - Wymagane: `id` (UUID v4)

### 2.3 PUT /api/flashcards/:id (Aktualizacja)

- **Metoda**: `PUT`
- **URL**: `/api/flashcards/[id]`
- **Request Body**:
  ```json
  {
    "front": "string (1-200)",
    "back": "string (1-500)",
    "source": "optional flashcard_source_type"
  }
  ```

### 2.4 DELETE /api/flashcards/:id (Usuwanie)

- **Metoda**: `DELETE`
- **URL**: `/api/flashcards/[id]`
- **Parametry**:
  - Wymagane: `id` (UUID v4)

## 3. Wykorzystywane typy

- `FlashcardDTO`: Model danych fiszki z bazy danych.
- `PaginatedData<FlashcardDTO>`: Struktura odpowiedzi dla listy.
- `UpdateFlashcardCommand`: Model danych dla żądania aktualizacji.
- `ApiResponse<T>`: Standardowa struktura odpowiedzi API.

## 4. Szczegóły odpowiedzi

- **200 OK**: Dla pomyślnego odczytu (`GET`), aktualizacji (`PUT`) i usunięcia (`DELETE`).
- **400 Bad Request**: Błędy walidacji danych wejściowych lub niedozwolone reguły biznesowe (np. błędna zmiana źródła).
- **401 Unauthorized**: Brak uwierzytelnienia użytkownika.
- **404 Not Found**: Zasób nie istnieje lub użytkownik nie ma do niego uprawnień.
- **500 Internal Server Error**: Błąd serwera lub bazy danych.

## 5. Przepływ danych

1. **API Layer**:
   - Przechwycenie żądania w Astro Server Endpoint.
   - Weryfikacja sesji użytkownika (`locals.user`).
   - Walidacja parametrów/body za pomocą `zod`.
2. **Service Layer (`FlashcardService`)**:
   - Wywołanie odpowiedniej metody z wstrzyknięciem klienta `supabase` i `userId`.
   - W przypadku `PUT`, pobranie obecnego stanu fiszki w celu weryfikacji reguł przejścia źródła.
   - Wykonanie operacji na bazie danych.
   - Jeśli nastąpiła zmiana `ai-full` -> `ai-edited`, wywołanie logiki aktualizującej statystyki w tabeli `generations`.
3. **Database Layer**:
   - Wykorzystanie Supabase RLS do izolacji danych użytkowników.

## 6. Względy bezpieczeństwa

- **Autoryzacja**: Każde żądanie musi zawierać ważną sesję. `user_id` jest zawsze pobierany z bezpiecznego kontekstu `locals`.
- **IDOR Protection**: Nawet jeśli użytkownik zna UUID fiszki innego użytkownika, zapytania do bazy danych zawsze zawierają `.eq('user_id', userId)`, co uniemożliwia nieuprawniony dostęp.
- **Input Sanitization**: Wszystkie dane tekstowe są przycinane (`trim()`) i walidowane pod kątem długości przed zapisem.

## 7. Obsługa błędów

- **Błędy walidacji**: Zwracanie tablicy szczegółów błędów (pole, wiadomość).
- **Logowanie**: Błędy krytyczne (DB, 500) logowane do konsoli serwera z kontekstem (ID użytkownika, metoda).
- **Reguły biznesowe (PUT)**:
  - Jeśli próba aktualizacji dotyczy fiszki `manual` i próbuje zmienić źródło na AI -> błąd 400.
  - Jeśli próba aktualizacji dotyczy fiszki `ai-full` i tekst uległ zmianie bez jawnego ustawienia `source: ai-edited`, usługa powinna automatycznie obsłużyć zmianę statusu.

## 8. Wydajność

- **Paginacja**: Wymuszona na poziomie API, aby uniknąć pobierania tysięcy rekordów na raz.
- **Indeksy**: Wykorzystanie istniejących indeksów B-Tree na kolumnach `user_id` i `created_at`.
- **Atomowość**: Operacje aktualizacji fiszki i statystyk generowania powinny być wykonywane w miarę możliwości w sposób spójny.

## 9. Kroki implementacji

1. **Rozszerzenie `FlashcardService` (`src/lib/services/flashcard.service.ts`)**:
   - Implementacja `getFlashcards` z obsługą filtrów i paginacji.
   - Implementacja `getFlashcardById`.
   - Implementacja `updateFlashcard` z logiką przejść `source` i aktualizacją liczników w `generations`.
   - Implementacja `deleteFlashcard`.

2. **Aktualizacja `src/pages/api/flashcards/index.ts`**:
   - Dodanie handlera `GET` do obsługi listy fiszek.

3. **Utworzenie `src/pages/api/flashcards/[id].ts`**:
   - Implementacja handlera `GET` (szczegóły).
   - Implementacja handlera `PUT` (aktualizacja).
   - Implementacja handlera `DELETE` (usuwanie).

4. **Testy**:
   - Weryfikacja paginacji i filtrowania.
   - Testy negatywne: próba edycji nie swojej fiszki, próba zmiany źródła z `manual` na AI.
   - Weryfikacja poprawności aktualizacji liczników w tabeli `generations` po edycji fiszki AI.
