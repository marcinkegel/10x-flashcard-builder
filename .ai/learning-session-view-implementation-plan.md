# Plan implementacji widoku Sesji Nauki

## 1. Przegląd
Widok sesji nauki umożliwia użytkownikowi aktywną powtórkę fiszek w uproszczonym trybie. System losuje maksymalnie 12 fiszek z biblioteki użytkownika i prezentuje je kolejno. Wylosowane fiszki trafiają do kolejki w losowej kolejności, tak aby każda sesja, nawet składająca się z tych samych kart była nieco inna. Użytkownik decyduje, czy dana fiszka jest mu znana, czy wymaga powtórzenia w ramach tej samej sesji. Sesja kończy się w momencie, gdy wszystkie fiszki zostaną oznaczone jako "Znam".

## 2. Routing widoku
- **Ścieżka**: `/session`
- **Layout**: Dedykowany minimalistyczny layout (ukrycie standardowego headera i sidebaru, jedynie przycisk "Wyjdź").

## 3. Struktura komponentów
```
LearningSessionContainer (React)
├── SessionHeader (minimalistyczny pasek z przyciskiem wyjścia)
├── SessionProgress (pasek postępu)
├── StudyCard (komponent 3D z animacją flip)
│   ├── CardFront
│   └── CardBack
├── SessionControls (przyciski akcji: Znam / Powtórz)
└── SessionSummary (widok końcowy ze statystykami)
```

## 4. Szczegóły komponentów

### LearningSessionContainer
- **Opis**: Główny komponent zarządzający stanem sesji, pobieraniem danych i logiką kolejkowania.
- **Główne elementy**: Kontener centrujący, warunkowe renderowanie sesji lub podsumowania.
- **Obsługiwane interakcje**: Inicjalizacja sesji, obsługa skrótów klawiszowych (Space, 1, 2).
- **Typy**: `SessionStateVM`, `SessionFlashcardVM`.

### StudyCard
- **Opis**: Komponent realizujący wizualny efekt obracania karty.
- **Główne elementy**: `div` z `preserve-3d`, przód i tył karty.
- **Obsługiwane interakcje**: Kliknięcie w kartę (obrót).
- **Propsy**: `front: string`, `back: string`, `isFlipped: boolean`, `onClick: () => void`.

### SessionControls
- **Opis**: Zestaw przycisków wyświetlany po odwróceniu karty.
- **Główne elementy**: Przycisk "Znam" (kolor zielony), "Powtórz" (kolor szary).
- **Obsługiwane interakcje**: Wybór oceny.
- **Propsy**: `onKnown: () => void`, `onRepeat: () => void`, `disabled: boolean`.

### SessionSummary
- **Opis**: Ekran końcowy wyświetlany po zakończeniu sesji.
- **Główne elementy**: Ikona sukcesu, lista statystyk, przycisk "Nowa sesja", przycisk "Wróć do biblioteki".
- **Propsy**: `stats: SessionStatsVM`, `onRestart: () => void`.

## 5. Typy

### SessionFlashcardVM
```typescript
interface SessionFlashcardVM {
  id: string;
  front: string;
  back: string;
  repeatCount: number; // ile razy użytkownik kliknął "Powtórz" dla tej karty
  wasAlwaysCorrect: boolean; // czy od początku kliknięto "Znam"
}
```

### SessionStateVM
```typescript
interface SessionStateVM {
  queue: SessionFlashcardVM[];
  currentIndex: number;
  isFlipped: boolean;
  completedCardsCount: number;
  totalInitialCards: number;
  sessionStats: SessionStatsVM;
}
```

### SessionStatsVM
```typescript
interface SessionStatsVM {
  totalCards: number;
  firstTimeCorrect: number; // Liczba fiszek zaliczonych bez ani jednego powtórzenia
  totalRepeats: number; // Sumaryczna liczba kliknięć "Powtórz"
}
```

## 6. Zarządzanie stanem
Zastosowany zostanie customowy hook `useLearningSession`, który będzie zarządzał stanem sesji wyłącznie w pamięci (React state). Odświeżenie strony resetuje postęp. Hook będzie zarządzał:
- Kolejką fiszek (dynamiczna lista, do której "Powtórz" dokleja element na koniec).
- Licznikiem powtórek i statystykami.
- Stanem odwrócenia karty.
- Logiką zakończenia sesji.

## 7. Integracja API
- **Endpoint**: `GET /api/flashcards?limit=12&sort=random`
- **Typ żądania**: Brak body.
- **Typ odpowiedzi**: `ApiResponse<PaginatedData<FlashcardDTO>>`.
- **Logika**: Pobieramy bezpośrednio 12 losowych fiszek z całej bazy danych użytkownika. Wymaga to dodania obsługi `sort=random` w serwisie po stronie backendu lub wykorzystania faktu, że przy braku sprecyzowanego sortowania i limicie, baza zwraca dane w sposób zbliżony do losowego.

## 8. Interakcje użytkownika
1. **Start**: Pobranie 12 losowych fiszek bezpośrednio z API.
2. **Prezentacja**: Wyświetlenie przodu pierwszej karty z kolejki.
3. **Obrót**: Kliknięcie w kartę lub `Spacja` odwraca kartę (animacja 3D).
4. **Ocena**:
   - `1` lub "Powtórz": Fiszka trafia na koniec `queue`, `repeatCount` danej fiszki rośnie, `totalRepeats` sesji rośnie.
   - `2` lub "Znam": Fiszka zostaje usunięta z aktualnej kolejki. Jeśli to jej pierwsze podejście, rośnie `firstTimeCorrect`.
5. **Kolejna karta**: Automatyczne przejście do następnej fiszki w kolejce (reset `isFlipped`).
6. **Koniec**: Gdy `queue` jest pusta, wyświetlenie `SessionSummary`.

## 9. Warunki i walidacja
- Jeśli użytkownik posiada 0 fiszek -> wyświetl komunikat "Brak fiszek w bibliotece" z linkiem do ich tworzenia.
- Jeśli użytkownik posiada < 12 fiszek -> sesja obejmuje wszystkie dostępne karty.
- Blokada przycisków oceny, dopóki karta nie zostanie odwrócona.

## 10. Obsługa błędów
- Błąd pobierania danych: Wyświetlenie komponentu `Alert` z przyciskiem "Spróbuj ponownie".
- Brak autoryzacji: Przekierowanie do strony logowania.

## 11. Kroki implementacji
1. Utworzenie nowej strony Astro `src/pages/session.astro`.
2. Implementacja minimalistycznego layoutu "distraction-free".
3. Stworzenie typów ViewModel w `src/types.ts`.
4. Implementacja komponentu `StudyCard` z animacjami Tailwind 4.
5. Implementacja hooka `useLearningSession` z logiką kolejkowania.
6. Budowa komponentu `LearningSessionContainer` integrującego pobieranie danych i podkomponenty.
7. Implementacja widoku `SessionSummary`.
8. Dodanie obsługi zdarzeń klawiatury (`window.addEventListener('keydown', ...)`).
9. Przygotowanie podsumowania z informacjami wstępnymi do implementacji  testów.
