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
- **Walidacja**: Przycisk nieaktywny, jeśli długość tekstu poza zakresem lub trwa ładowanie.
- **Propsy**:
    - `onGenerate: (text: string) => Promise<void>`
    - `isGenerating: boolean`

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
    - `mode`: 'view' | 'edit'
- **Wygląd (View Mode)**:
    - Status `pending`: Styl domyślny (neutralny).
    - Status `accepted`: Zielona poświata/ramka.
    - Status `rejected`: Czerwona poświata/ramka, zmniejszone krycie (opacity).
- **Akcje**:
    - **Zatwierdź**: Ustawia `status: 'accepted'`.
    - **Odrzuć**: Ustawia `status: 'rejected'`.
    - **Edytuj**: Włącza `mode: 'edit'`.
- **Logika Edycji**:
    - Zmiana treści aktualizuje lokalny stan formularza.
    - Zapisanie edycji: Waliduje długość -> Aktualizuje ViewModel -> Ustawia `status: 'accepted'` -> Ustawia `source: 'ai-edited'` -> Wraca do `mode: 'view'`.
- **Propsy**:
    - `proposal`: Obiekt ViewModel.
    - `onUpdate`: Callback aktualizujący stan w rodzicu.

### `BulkActionToolbar`
- **Rola**: Pasek akcji masowych.
- **Elementy**:
    - Przycisk "Zapisz zatwierdzone" (`saveAccepted`).
    - Przycisk "Zapisz nieodrzucone" (`saveNonRejected` - domyślna, preferowana akcja).
- **Walidacja**: Przyciski zablokowane, jeśli jakakolwiek fiszka jest w trybie edycji (`mode === 'edit'`).

### `ManualFlashcardForm`
- **Rola**: Formularz dodawania pojedynczej fiszki.
- **Elementy**: Input Front, Textarea Back, Button Zapisz.
- **Walidacja**: Front (1-200), Back (1-500).
- **Logika**: Po zapisie czyści formularz i pokazuje Toast sukcesu.

## 5. Typy

Należy dodać w `src/types.ts` lub `src/components/features/flashcards/types.ts`:

```typescript
export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

export interface FlashcardProposalViewModel {
  id: string;             // Tymczasowe UUID generowane przez frontend lub ID z backendu
  front: string;
  back: string;
  // Pola potrzebne do wykrycia czy treść została zmieniona względem oryginału AI
  originalFront: string;
  originalBack: string;
  
  source: 'ai-full' | 'ai-edited';
  status: ProposalStatus;
  generationId: string;   // ID sesji generacji zwrócone przez API
}

export type SaveStrategy = 'accepted_only' | 'non_rejected';
```

## 6. Zarządzanie stanem

Dedykowany hook `useGenerationSession` powinien zarządzać całą logiką "AI Session".

### Stan hooka:
- `sourceText` (string)
- `generationId` (string | null)
- `proposals` (FlashcardProposalViewModel[])
- `isGenerating` (boolean)
- `isSaving` (boolean)

### Funkcjonalności hooka:
1.  **Persystencja**: Użycie `sessionStorage` do zapisu stanu `proposals` i `generationId`. Dzięki temu odświeżenie strony nie usuwa wygenerowanych wyników.
2.  **Generowanie**:
    - Woła `POST /api/generations`.
    - Mapuje odpowiedź na `FlashcardProposalViewModel` (domyślnie `status: 'pending'`, `source: 'ai-full'`).
3.  **Aktualizacja Propozycji**:
    - Funkcja `updateProposal(id, partialChanges)` do obsługi zmian statusu i treści.
4.  **Obliczanie Statystyk**:
    - Ilość zatwierdzonych/odrzuconych do wyświetlania na UI.
5.  **Zapis Masowy (Bulk Save)**:
    - Przyjmuje strategię (`accepted_only` lub `non_rejected`).
    - Filtruje `proposals`.
    - Konwertuje na `CreateFlashcardDTO`.
    - Woła `POST /api/flashcards`.
    - Po sukcesie: Usuwa zapisane fiszki z listy (i z sessionStorage), pokazuje Toast.

## 7. Integracja API

### Generowanie
- **Endpoint**: `POST /api/generations`
- **Request**:
  ```typescript
  { source_text: string }
  ```
- **Response**:
  ```typescript
  {
    success: true,
    data: {
      generation_id: string,
      proposals: Array<{ proposal_id: string, front: string, back: string }>
    }
  }
  ```

### Tworzenie Fiszek (Manualne i AI)
- **Endpoint**: `POST /api/flashcards`
- **Request** (Tablica obiektów):
  ```typescript
  Array<{
    front: string;
    back: string;
    source: 'manual' | 'ai-full' | 'ai-edited';
    generation_id: string | null;
  }>
  ```
- **Response**: Zwraca utworzone obiekty.

## 8. Interakcje użytkownika

1.  **Wejście na stronę**: Sprawdzenie `sessionStorage`. Jeśli są dane -> odtwórz widok listy. Jeśli nie -> czysty formularz.
2.  **Wklejenie tekstu i Generuj**:
    - Pokazuje Skeleton loader.
    - Po sukcesie: Przełącza widok na listę propozycji.
3.  **Praca z listą**:
    - Kliknięcie "Odrzuć" -> Karta robi się czerwona.
    - Kliknięcie "Zatwierdź" -> Karta robi się zielona.
    - Kliknięcie "Edytuj" -> Inputy stają się edytowalne.
    - Zapis edycji -> Walidacja -> Karta robi się zielona (`accepted`).
4.  **Próba wyjścia (Nawigacja/Zamknięcie)**:
    - Jeśli są niezapisane propozycje -> Przeglądarkowy alert `beforeunload`.
5.  **Zapisz nieodrzucone**:
    - Zbiera wszystkie karty ze statusem `accepted` ORAZ `pending`.
    - Wysyła do API.
    - Czyści listę i wraca do widoku formularza (lub zostawia formularz z tekstem, ale bez listy).

## 9. Warunki i walidacja

### Walidacja Danych
1.  **Tekst Źródłowy**: Długość [1000, 10000].
2.  **Fiszka**:
    - `front`: [1, 200] znaków.
    - `back`: [1, 500] znaków.
    - Nie może być pusta (trim).

### Walidacja Stanu UI
1.  **Blokada Generowania**: Jeśli `text.length` poza limitem LUB `isGenerating === true`.
2.  **Blokada Zapisu (AI)**: Jeśli którakolwiek karta jest w trybie edycji (`mode === 'edit'`), przyciski "Zapisz..." są nieaktywne (`disabled`).
3.  **Synchronizacja Źródła**: Przy zapisie edycji, jeśli treść różni się od `originalFront`/`originalBack`, pole `source` musi być ustawione na `'ai-edited'`. W przeciwnym razie `'ai-full'`.

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

1.  **Typy**: Zaktualizuj `src/types.ts` o `FlashcardProposalViewModel` i `ProposalStatus`.
2.  **Hook**: Zaimplementuj `useGenerationSession` (logika API + sessionStorage).
3.  **UI - Komponenty proste**: Stwórz `CharacterCounter`, `StatusToast` (jeśli nie istnieje).
4.  **UI - Tryb Manualny**: Zaimplementuj `ManualCreationView` i formularz.
5.  **UI - Tryb AI - Item**: Zaimplementuj `ProposalItem` (kluczowe: przejścia stylów statusów i tryb edycji).
6.  **UI - Tryb AI - Lista**: Zaimplementuj `ProposalList` i `BulkActionToolbar`.
7.  **UI - Kontener**: Złóż wszystko w `CreateFlashcardsContainer` i podepnij pod stronę Astro.
8.  **Integracja**: Podłącz hook pod komponenty.
9.  **Weryfikacja**:
    - Sprawdź limity znaków.
    - Sprawdź flow: Generuj -> Edytuj -> Zapisz.
    - Sprawdź odświeżenie strony (persystencja).
