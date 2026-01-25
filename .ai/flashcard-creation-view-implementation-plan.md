# Plan implementacji widoku tworzenia fiszek (Generate View)

## 1. Przegląd

Widok `/generate` służy jako centralny punkt tworzenia nowych fiszek. Umożliwia użytkownikom:

1.  **Generowanie AI**: Tworzenie wielu fiszek na podstawie długiego tekstu źródłowego, ich recenzję (akceptacja/odrzucenie/edycja) oraz masowy zapis.
2.  **Tworzenie Ręczne**: Tradycyjne dodawanie pojedynczych fiszek za pomocą formularza.

Widok wykorzystuje hybrydowe podejście Astro (routing/layout) i React (interaktywność, zarządzanie stanem sesji).

## 2. Routing widoku

- **Ścieżka**: `/generate`
- **Plik strony**: `src/pages/generate.astro`
- **Główny komponent**: `src/components/features/flashcards/CreateFlashcardsContainer.tsx` (ładowany z dyrektywą `client:only="react"`)

## 3. Struktura komponentów

```text
src/pages/generate.astro
└── CreateFlashcardsContainer.tsx (Zarządza stanem zakładek i sesji)
    ├── ui/tabs (Shadcn)
    ├── AIGenerationView.tsx (Kontener zakładki AI)
    │   ├── AIGenerationForm.tsx (Input tekstu + Przycisk Generuj)
    │   │   └── CharacterCounter.tsx
    │   ├── GenerationStatus.tsx (Skeletony / Loading state)
    │   ├── ProposalList.tsx (Lista wyników)
    │   │   └── ProposalItem.tsx (Pojedyncza karta: Tryb View/Edit)
    │   │       ├── CharacterCounter.tsx
    │   │       └── ProposalActions.tsx (Przyciski: Zatwierdź/Edytuj/Odrzuć)
    │   └── BulkActionToolbar.tsx (Sticky pasek: Zapisz wybrane)
    └── ManualCreationView.tsx (Kontener zakładki Manual)
        └── ManualFlashcardForm.tsx
            └── CharacterCounter.tsx
```

## 4. Szczegóły komponentów

### `CreateFlashcardsContainer`

- **Rola**: Główny wrapper. Inicjuje hook `useGenerationSession`. Obsługuje `beforeunload` (ostrzeżenie przed utratą niezapisanych danych).
- **Elementy**: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
- **Propsy**: Brak.

### `AIGenerationForm`

- **Rola**: Pobiera tekst źródłowy do generowania.
- **Elementy**: `Textarea` (min 1000, max 10000 znaków), `Button` (Generuj).
- **Walidacja**: Przycisk nieaktywny, jeśli długość tekstu poza zakresem, trwa ładowanie lub istnieją aktywne propozycje.
- **UX**: Max wysokość textarea (400px) ze scrollem. Czerwona ramka i błędy inline wyświetlane pod licznikiem znaków po `blur` lub przekroczeniu limitu. Autoscroll do błędów. Komunikat informacyjny o aktywnej sesji blokującej nowe generowanie.
- **Propsy**:
  - `onGenerate: (text: string) => Promise<{ success: boolean; error?: string }>`
  - `isGenerating: boolean`
  - `hasActiveProposals: boolean`

### `ProposalList`

- **Rola**: Wyświetla listę propozycji zwróconych przez AI.
- **Elementy**: Mapuje listę `proposals` na komponenty `ProposalItem`.
- **Propsy**:
  - `proposals: FlashcardProposalViewModel[]`
  - `onStatusChange`: funkcja do zmiany statusu (accepted/rejected).
  - `onContentChange`: funkcja do zapisu edycji propozycji.

### `ProposalItem`

- **Rola**: Wyświetla pojedynczą fiszkę z możliwością edycji inline.
- **Stany**:
  - `isEditing`: boolean (zarządzane w ViewModel lub lokalnie w komponencie, jeśli chcemy izolacji)
- **Wygląd (View Mode)**:
  - Status `pending`: Styl domyślny (neutralny).
  - Status `accepted`: Zielona poświata/ramka.
  - Status `rejected`: Czerwona poświata/ramka, zmniejszone krycie (opacity).
- **Akcje**:
  - **Zatwierdź**: Ustawia `status: 'accepted'`.
  - **Odrzuć**: Ustawia `status: 'rejected'`.
  - **Edytuj**: Włącza tryb edycji (`isEditing = true`).
- **Logika Edycji**:
  - Zmiana treści aktualizuje lokalny stan formularza.
  - Zapisanie edycji: Walidacja długości -> Aktualizacja ViewModel -> Ustawia `source: 'ai-edited'` -> Karta robi się zielona `status: 'accepted`. Wyłącza edycję.
- **Propsy**:
  - `proposal`: Obiekt ViewModel (`FlashcardProposalViewModel`).
  - `onUpdate`: Callback aktualizujący stan w rodzicu.

### `BulkActionToolbar`

- **Rola**: Pasek akcji masowych (sticky).
- **Elementy**:
  - Przycisk "Zapisz zatwierdzone" (`saveAccepted`).
  - Przycisk "Zapisz nieodrzucone" (`saveNonRejected`).
  - Przycisk "Usuń niezapisane" (czyści sesję).
- **Layout**: Pionowy na mobile (`flex-col`), poziomy na desktopie.
- **Walidacja**: Przyciski zablokowane, jeśli jakakolwiek fiszka jest w trybie edycji (`isEditing === true`).
- **Propsy**:
  - `onSave`, `onClear`, `isSaving`, `anyEditing`, `acceptedCount`, `nonRejectedCount`.

### `ManualFlashcardForm`

- **Rola**: Formularz dodawania pojedynczej fiszki.
- **UX**: Czerwone ramki pól i błędy inline po `blur`. Autoscroll do błędów.
- **Logika**: Po zapisie czyści formularz i pokazuje Toast sukcesu.

## 5. Typy

Wykorzystujemy typy zdefiniowane w `src/types.ts`:

- `FlashcardProposalViewModel` (dla stanu listy)
- `CreateFlashcardCommand` (dla payloadu do API)
- `GenerateFlashcardsCommand` (dla payloadu generowania)

Należy dodać lokalnie typ dla strategii zapisu:

```typescript
export type SaveStrategy = "accepted_only" | "non_rejected";
```

## 6. Zarządzanie stanem

Dedykowany hook `useGenerationSession` powinien zarządzać całą logiką "AI Session".

### Stan hooka:

- `sourceText` (string)
- `generationId` (string | null) - przechowywane osobno, łączy się z fiszkami przy zapisie
- `proposals` (FlashcardProposalViewModel[])
- `isGenerating` (boolean)
- `isSaving` (boolean)

### Funkcjonalności hooka:

1.  **Persystencja**: Użycie `sessionStorage` do zapisu stanu `proposals` i `generationId`. Dzięki temu odświeżenie strony nie usuwa wygenerowanych wyników.
2.  **Generowanie**:
    - Woła `POST /api/generations`.
    - Mapuje odpowiedź API na `FlashcardProposalViewModel` (domyślnie `status: 'pending'`, `source: 'ai-full'`, `isEditing: false`).
3.  **Aktualizacja Propozycji**:
    - Funkcja `updateProposal(id, partialChanges)` do obsługi zmian statusu, treści i flagi `isEditing`.
4.  **Zapis Masowy (Bulk Save)**:
    - Przyjmuje strategię (`accepted_only` lub `non_rejected`).
    - Filtruje `proposals`.
    - Konwertuje na `CreateFlashcardCommand`, dodając `generationId` ze stanu hooka.
    - Woła `POST /api/flashcards`.
    - Po sukcesie: Usuwa zapisane fiszki z listy, pokazuje Toast.

## 7. Integracja API

### Generowanie

- **Endpoint**: `POST /api/generations`
- **Request**: `GenerateFlashcardsCommand`
- **Response**: `ApiResponse<GenerationResponseDTO>`

### Tworzenie Fiszek (Manualne i AI)

- **Endpoint**: `POST /api/flashcards`
- **Request**: `CreateFlashcardCommand[]`
- **Response**: `ApiResponse<FlashcardDTO[]>`

## 8. Interakcje użytkownika

1.  **Wejście na stronę**: Sprawdzenie `sessionStorage`. Jeśli są dane -> odtwórz widok listy. Jeśli nie -> czysty formularz.
2.  **Wklejenie tekstu i Generuj**:
    - Pokazuje Skeleton loader.
    - Po sukcesie: Pokaż listę propozycji.
3.  **Praca z listą**:
    - Kliknięcie "Odrzuć" -> Karta robi się czerwona.
    - Kliknięcie "Zatwierdź" -> Karta robi się zielona.
    - Kliknięcie "Edytuj" -> Inputy stają się edytowalne.
    - Zapis edycji -> Walidacja -> Zmiana source na `ai-edited` -> Karta robi się zielona (`accepted`).
4.  **Próba wyjścia (Nawigacja/Zamknięcie)**:
    - Jeśli są niezapisane propozycje -> Przeglądarkowy alert `beforeunload`.
5.  **Zapisz nieodrzucone**:
    - Zbiera wszystkie karty ze statusem `accepted` ORAZ `pending`.
    - Wysyła do API.
    - Czyści listę i wraca do widoku formularza.

## 9. Warunki i walidacja

### Walidacja Danych

1.  **Tekst Źródłowy**: Długość [1000, 10000].
2.  **Fiszka**:
    - `front`: [1, 200] znaków.
    - `back`: [1, 500] znaków.
    - Nie może być pusta (trim).

### Walidacja Stanu UI

1.  **Blokada Generowania**: Jeśli `text.length` poza limitem LUB `isGenerating === true`.
2.  **Blokada Zapisu (AI)**: Jeśli którakolwiek karta jest w trybie edycji (`isEditing === true`), przyciski "Zapisz..." są nieaktywne (`disabled`).
3.  **Status Source**: Przy wyjściu z edycji (Zapisz Edycję), pole `source` w ViewModelu ustawiane jest na `'ai-edited'`.

## 10. Obsługa błędów

1.  **Błąd Generowania (API)**:
    - Wyświetl `Toast` z komunikatem błędu.
    - **Nie czyść** pola tekstowego, aby użytkownik mógł spróbować ponownie lub poprawić tekst.
2.  **Błąd Zapisu (API)**:
    - Jeśli 400 (Walidacja): Wyświetl, które fiszki są błędne (choć walidacja frontendowa powinna to wyłapać).
    - Jeśli 500: Komunikat "Spróbuj ponownie".
    - Nie usuwaj fiszek z listy, dopóki zapis nie zakończy się sukcesem.
3.  **Błędy Sieci**: Standardowa obsługa (Toast).

## 11. Kroki implementacji

1.  **Hook**: Zaimplementuj `useGenerationSession` (logika API + sessionStorage) wykorzystując typy z `src/types.ts`.
2.  **UI - Komponenty proste**: Stwórz `CharacterCounter` (jeśli brak), `StatusToast` (jeśli brak).
3.  **UI - Tryb Manualny**: Zaimplementuj `ManualCreationView` i formularz.
4.  **UI - Tryb AI - Item**: Zaimplementuj `ProposalItem` (obsługa `isEditing` z ViewModelu).
5.  **UI - Tryb AI - Lista**: Zaimplementuj `ProposalList` i `BulkActionToolbar`.
6.  **UI - Kontener**: Złóż wszystko w `CreateFlashcardsContainer`.
7.  **Integracja**: Podłącz hook pod komponenty.
8.  **Refaktoryzacja**: Finalny code review i refaktoryzacja przed wdrożeniem.
9.  **Weryfikacja**:
    - Sprawdź limity znaków.
    - Sprawdź poprawność zmiany statusu na `ai-edited` po edycji.
    - Sprawdź zapis masowy.
    - Sprawdź odświeżenie strony (persystencja).
    - Sprawdź flow: Generuj -> Edytuj -> Zapisz.
