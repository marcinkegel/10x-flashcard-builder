# Plan implementacji widoku Moje fiszki (Biblioteka)

## 1. Przegląd
Widok "Moje fiszki" (Biblioteka) jest centralnym miejscem zarządzania bazą wiedzy użytkownika. Umożliwia przeglądanie wszystkich zapisanych fiszek w formie przejrzystej listy/siatki, gdzie treść pytania (front) i odpowiedzi (tył) jest widoczna jednocześnie. Użytkownik może z tego poziomu edytować treść fiszek oraz usuwać te niepotrzebne.

## 2. Routing widoku
- **Ścieżka**: `/flashcards`
- **Typ strony**: Astro Page z wyspą React (Client-side interactivity).

## 3. Struktura komponentów
```text
FlashcardsPage (Astro)
└── Layout (Astro)
    └── FlashcardsLibrary (React, Client)
        ├── LibraryHeader (React) - Tytuł i opcjonalne filtry
        ├── FlashcardList (React) - Kontener siatki/listy
        │   ├── FlashcardItem (React) - Karta z akcjami
        │   │   ├── EditFlashcardDialog (React/Shadcn)
        │   │   └── DeleteFlashcardDialog (React/Shadcn)
        │   └── FlashcardSkeleton (React) - Stan ładowania
        ├── EmptyState (React) - Widok przy braku fiszek
        └── PaginationControl (React) - Nawigacja stronami
```

## 4. Szczegóły komponentów

### FlashcardsLibrary (Główny komponent)
- **Opis**: Zarządza stanem danych (pobieranie, paginacja, synchronizacja po edycji/usunięciu).
- **Główne elementy**: `LibraryHeader`, `FlashcardList`, `PaginationControl`.
- **Obsługiwane interakcje**: Zmiana strony, odświeżanie danych po akcjach.
- **Typy**: `PaginatedData<FlashcardDTO>`, `PaginationDTO`.
- **Propsy**: Brak (komponent typu "smart" pobierający dane z API).

### FlashcardItem
- **Opis**: Reprezentuje pojedynczą fiszkę. Wyświetla front i tył w statycznej formie (bez animacji obracania dla ułatwienia skanowania wzrokiem).
- **Główne elementy**: Tekst frontu, tekst tyłu, przycisk "Edytuj" (ikona), przycisk "Usuń" (ikona).
- **Obsługiwane interakcje**: Otwarcie modala edycji, otwarcie modala usuwania.
- **Typy**: `FlashcardDTO`.
- **Propsy**: `flashcard: FlashcardDTO`, `onUpdate: (updated: FlashcardDTO) => void`, `onDelete: (id: string) => void`.

### EditFlashcardDialog
- **Opis**: Formularz w modalu (Shadcn Dialog) do edycji treści fiszki.
- **Główne elementy**: `Textarea` dla frontu i tyłu, liczniki znaków, przycisk "Zapisz", przycisk "Anuluj".
- **Obsługiwana walidacja**: 
    - Front: 1-200 znaków.
    - Tył: 1-500 znaków.
    - Blokada zapisu przy błędach walidacji lub braku zmian.
- **Typy**: `UpdateFlashcardCommand`.
- **Propsy**: `flashcard: FlashcardDTO`, `isOpen: boolean`, `onClose: () => void`, `onSuccess: (updated: FlashcardDTO) => void`.

### DeleteFlashcardDialog
- **Opis**: Modal potwierdzenia (Shadcn AlertDialog) usunięcia fiszki.
- **Główne elementy**: Komunikat ostrzegawczy, przycisk "Usuń" (destrukcyjny), przycisk "Anuluj".
- **Obsługiwane interakcje**: Potwierdzenie usunięcia (wywołanie API DELETE).
- **Propsy**: `flashcardId: string`, `isOpen: boolean`, `onClose: () => void`, `onSuccess: () => void`.

## 5. Typy
Wykorzystanie istniejących typów z `src/types.ts`:
- `FlashcardDTO`: Pełny obiekt fiszki z bazy danych.
- `PaginatedData<T>`: Struktura odpowiedzi dla listowania z paginacją.
- `UpdateFlashcardCommand`: Pola `front`, `back`, `source` przesyłane w `PUT`.
- `ApiResponse<T>`: Standardowy wrapper odpowiedzi API.

## 6. Zarządzanie stanem
Zastosowanie React `useState` i `useEffect` (lub biblioteki typu `react-query` jeśli zostanie wprowadzona, jednak domyślnie standardowy `fetch` w hooku):
- `flashcards`: Lista aktualnie wyświetlanych fiszek.
- `pagination`: Metadane paginacji (`total_pages`, `current_page`).
- `isLoading`: Stan ładowania danych.
- `isInitialLoading`: Stan dla pierwszego ładowania (wyświetlanie Skeletons).

## 7. Integracja API
- **Pobieranie**: `GET /api/flashcards?page={page}&limit=12`
    - Response: `ApiResponse<PaginatedData<FlashcardDTO>>`
- **Aktualizacja**: `PUT /api/flashcards/{id}`
    - Payload: `{ front: string, back: string, source: "ai-edited" }`
    - Response: `ApiResponse<FlashcardDTO>`
- **Usuwanie**: `DELETE /api/flashcards/{id}`
    - Response: `ApiResponse<void>`

## 8. Interakcje użytkownika
1. **Wejście na stronę**: Wyzwalane jest pobieranie pierwszej strony fiszek. Wyświetlane są Skeletons.
2. **Nawigacja stronami**: Kliknięcie w paginację aktualizuje parametr `page` w stanie, co wyzwala nowy `fetch`.
3. **Edycja**: Kliknięcie "Edytuj" otwiera Dialog. Po poprawnym zapisie następuje aktualizacja lokalnego stanu listy (bez przeładowania całej strony) oraz wyświetlenie Toastu (Sonner).
4. **Usuwanie**: Kliknięcie "Usuń" otwiera AlertDialog. Po potwierdzeniu następuje usunięcie rekordu w API, usunięcie z lokalnego stanu i wyświetlenie Toastu.

## 9. Warunki i walidacja
- **Limity znaków**: Walidacja w czasie rzeczywistym w `EditFlashcardDialog` z wyświetlaniem komunikatów pod polami.
- **Pusta lista**: Jeśli API zwróci zero elementów, wyświetlany jest komponent `EmptyState` z zachętą do przejścia do widoku generowania (`/generate`).
- **Źródło (source)**: 
    - Przy edycji fiszki, która miała `source: "ai-full"`, aplikacja automatycznie wysyła w żądaniu `source: "ai-edited"`, aby odzwierciedlić fakt modyfikacji treści przez użytkownika (zgodnie z logiką backendową).
    - Przy edycji fiszki z `source: "manual"`, źródło pozostaje niezmienione (`"manual"`).
    - Przy edycji fiszki, która ma już status `source: "ai-edited"`, pozostaje on bez zmian.

## 10. Obsługa błędów
- **Błąd pobierania**: Wyświetlenie komunikatu o błędzie na środku ekranu z przyciskiem "Spróbuj ponownie".
- **Błąd zapisu/usuwania**: Wyświetlenie błędu w formie Toast (np. "Nie udało się zapisać zmian. Spróbuj ponownie").
- **401 Unauthorized**: Automatyczne przekierowanie do strony logowania (obsługiwane przez middleware/layout).

## 11. Kroki implementacji
1. **Utworzenie strony Astro**: Dodanie pliku `src/pages/flashcards.astro` z podstawowym layoutem.
2. **Komponenty UI**: Przygotowanie `FlashcardSkeleton` oraz `EmptyState` przy użyciu Tailwind i Shadcn.
3. **Główna logika (FlashcardsLibrary)**:
    - Implementacja pobierania danych (`fetch`).
    - Zarządzanie stanem paginacji.
4. **Widok Listy**: Implementacja `FlashcardList` oraz `FlashcardItem`.
5. **Obsługa Akcji**:
    - Implementacja `DeleteFlashcardDialog` z integracją `DELETE` API.
    - Implementacja `EditFlashcardDialog` z formularzem i walidacją.
6. **Powiadomienia**: Dodanie obsługi `sonner` dla wszystkich akcji sukcesu/błędu.
7. **Szlify UX**: Dodanie animacji wejścia (framer-motion lub Tailwind transitions) oraz upewnienie się, że grid jest responsywny (1 kolumna mobile, 2 tablet, 3-4 desktop).
