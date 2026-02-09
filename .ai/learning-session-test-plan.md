# Plan Testów: Sesja Nauki (Learning Session)

Ten dokument szczegółowo opisuje scenariusze testowe dla widoku Sesji Nauki, przygotowane pod kątem testów manualnych oraz przyszłej automatyzacji (Playwright).

## 1. Scenariusze interfejsu użytkownika (UI)

### T-UI-01: Start sesji i ładowanie danych
- **Kroki:**
  1. Wejdź na stronę `/session` przy posiadaniu fiszek w bibliotece.
  2. Sprawdź, czy wyświetla się stan ładowania (skeleton).
  3. Sprawdź, czy po załadowaniu wyświetla się pierwsza karta (tylko FRONT).
  4. Sprawdź, czy pasek postępu jest na poziomie 0%.
- **Oczekiwany rezultat:** Sesja ładuje się poprawnie, karta jest widoczna, header pokazuje "Karta 1 z X".

### T-UI-02: Brak fiszek w bibliotece
- **Kroki:**
  1. Usuń wszystkie fiszki z biblioteki lub zaloguj się na nowe konto.
  2. Wejdź na stronę `/session`.
- **Oczekiwany rezultat:** Wyświetla się komunikat "Twoja biblioteka jest pusta" z przyciskiem prowadzącym do generatora.

### T-UI-03: Interakcja z kartą (Flip)
- **Kroki:**
  1. Kliknij w kartę.
  2. Kliknij ponownie.
  3. Użyj klawisza `Spacja`.
- **Oczekiwany rezultat:** Karta płynnie obraca się o 180 stopni (animacja 3D). Przyciski kontrolne pojawiają się dopiero po odwróceniu na TYŁ.

## 2. Logika Sesji i Kolejkowanie

### T-LOG-01: Akcja "Znam" (Zaliczanie)
- **Kroki:**
  1. Odwróć kartę.
  2. Kliknij "Znam" (lub klawisz `2`).
- **Oczekiwany rezultat:** Karta znika, pojawia się następna. Pasek postępu przesuwa się do przodu.

### T-LOG-02: Akcja "Powtórz" (Kolejkowanie)
- **Kroki:**
  1. Odwróć kartę.
  2. Kliknij "Powtórz" (lub klawisz `1`).
  3. Przejdź wszystkie pozostałe karty w sesji.
- **Oczekiwany rezultat:** Karta, przy której wybrano "Powtórz", pojawia się ponownie na końcu sesji. Header zmienia informację na "Powtórka kart".

### T-LOG-03: Zakończenie sesji i statystyki
- **Kroki:**
  1. Ukończ sesję, wybierając "Powtórz" dla przynajmniej jednej karty.
  2. Dokończ powtórki wybierając "Znam".
- **Oczekiwany rezultat:** Wyświetla się ekran podsumowania. Statystyki "Bez powtórzeń" powinny być mniejsze niż 100%. "Suma powtórzeń" powinna być większa od 0.

## 3. Skróty Klawiszowe

### T-KEY-01: Obsługa pełnej sesji klawiaturą
- **Kroki:**
  1. `Spacja` -> `2` (Znam).
  2. `Spacja` -> `1` (Powtórz).
  3. Sprawdź czy skróty działają tylko gdy karta jest odwrócona (dla 1 i 2).
- **Oczekiwany rezultat:** Sesja daje się w pełni obsłużyć bez użycia myszki.

## 4. Responsywność (Mobile)

### T-MOB-01: Widok mobilny
- **Kroki:**
  1. Otwórz sesję w trybie mobilnym (np. iPhone 12/13).
  2. Sprawdź czy karta mieści się na ekranie.
  3. Sprawdź czy przyciski są łatwo klikalne.
  4. Sprawdź czy długa treść na karcie jest przewijalna.
- **Oczekiwany rezultat:** Interfejs jest czytelny, brak horyzontalnego scrolla, karta dostosowuje się do szerokości ekranu.

## 5. Integracja API

### T-API-01: Pobieranie losowych fiszek
- **Kroki:**
  1. Odśwież stronę sesji kilkukrotnie.
- **Oczekiwany rezultat:** Za każdym razem kolejność kart powinna być inna (dzięki `sort=random` w API i shuffle na froncie).

## 6. Testy Jednostkowe (Vitest) - ZAIMPLEMENTOWANE

Te testy skupiają się na izolowanej logice biznesowej oraz poprawności renderowania komponentów. Wszystkie poniższe testy zostały zaimplementowane i przechodzą pomyślnie.

### Lokalizacja plików testowych:
- Hook: `tests/unit/hooks/useLearningSession.test.ts`
- Komponenty: `tests/unit/components/features/session/*.test.tsx`

### T-UNI-01: Hook `useLearningSession` - Inicjalizacja (ZREALIZOWANO)
- **Cel:** Sprawdzenie poprawności stanu początkowego.
- **Przypadki testowe:**
  - Stan `queue` odpowiada przekazanej tablicy fiszek.
  - `completedCardsCount` wynosi 0.
  - `isFlipped` jest `false`.
  - `totalInitialCards` jest zgodny z długością tablicy wejściowej.

### T-UNI-02: Hook `useLearningSession` - Logika kolejkowania (Znam) (ZREALIZOWANO)
- **Cel:** Weryfikacja akcji "Znam".
- **Przypadki testowe:**
  - Wywołanie `handleKnown` usuwa pierwszą kartę z `queue`.
  - `completedCardsCount` wzrasta o 1.
  - Jeśli karta była nowa (0 powtórzeń), `firstTimeCorrect` w statystykach wzrasta.

### T-UNI-03: Hook `useLearningSession` - Logika kolejkowania (Powtórz) (ZREALIZOWANO)
- **Cel:** Weryfikacja akcji "Powtórz".
- **Przypadki testowe:**
  - Wywołanie `handleRepeat` przenosi pierwszą kartę na koniec `queue`.
  - Licznik `repeatCount` danej karty wzrasta o 1.
  - `totalRepeats` w statystykach sesji wzrasta.
  - `completedCardsCount` nie zmienia się.

### T-UNI-04: Komponent `StudyCard` - Renderowanie i Flip (ZREALIZOWANO)
- **Cel:** Sprawdzenie czy komponent poprawnie reaguje na propsy.
- **Przypadki testowe:**
  - Wyświetlanie treści `front` gdy `isFlipped` jest `false`.
  - Wyświetlanie treści `back` gdy `isFlipped` jest `true`.
  - Wywołanie `onClick` po kliknięciu w kontener.
  - Obsługa klawiszy `Spacja` i `Enter`.

### T-UNI-05: Komponent `SessionHeader` - Fazy sesji (ZREALIZOWANO)
- **Cel:** Weryfikacja wyświetlania postępu.
- **Przypadki testowe:**
  - Wyświetlanie "Karta X z Y" w fazie podstawowej (`isRepeatPhase: false`).
  - Wyświetlanie "Powtórka kart" w fazie powtórek (`isRepeatPhase: true`).

### T-UNI-06: Komponent `SessionSummary` - Obliczenia (ZREALIZOWANO)
- **Cel:** Weryfikacja poprawności wyświetlanych statystyk.
- **Przypadki testowe:**
  - Obliczanie procentu "Bez powtórzeń" na podstawie `firstTimeCorrect` i `totalCards`.
  - Wyświetlanie poprawnej sumy powtórzeń.
  - Obsługa przycisków "Nowa sesja" i "Wróć do biblioteki".
