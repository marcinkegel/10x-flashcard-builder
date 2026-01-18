# Architektura UI dla Flashcard Builder MVP

## 1. Przegląd struktury UI

Aplikacja Flashcard Builder MVP została zaprojektowana jako nowoczesna aplikacja jednostronicowa (SPA) osadzona w szkielecie Astro 5, wykorzystująca React 19 do dynamicznych interakcji. Struktura opiera się na przyklejonym (sticky) pasku nawigacyjnym (Topbar), który zapewnia stały dostęp do kluczowych funkcji aplikacji. Interfejs jest w pełni responsywny, przechodząc z horyzontalnego menu na pulpicie do panelu bocznego (Sheet) na urządzeniach mobilnych.

## 2. Lista widoków

### Widok: Logowanie i Rejestracja
- **Ścieżka**: `/auth/login`, `/auth/register`
- **Główny cel**: Uwierzytelnienie użytkownika i dostęp do bazy danych.
- **Kluczowe informacje**: Formularze e-mail/hasło, komunikaty o błędach walidacji.
- **Kluczowe komponenty**: `Card`, `Input`, `Button`, `Form` (shadcn/ui).
- **UX, dostępność i bezpieczeństwo**: 
    - Walidacja siły hasła (małe/wielkie litery, cyfry, znaki specjalne).
    - Ukrywanie szczegółów błędów logowania (bezpieczeństwo).
    - Automatyczne logowanie po rejestracji.

### Widok tworzenia fiszek (Generowanie i Tworzenie)
- **Ścieżka**: `/generate`
- **Główny cel**: Centralny punkt tworzenia treści – automatycznie przez AI lub ręcznie.
- **Kluczowe informacje**: Zakładki (Tabs) między AI a Manual, pole tekstowe źródłowe, lista propozycji AI.
- **Kluczowe komponenty**: 
    - `Tabs`: Przełączanie trybu pracy.
    - `Textarea`: Z licznikami znaków (1k-10k dla AI).
    - `AIProposalList`: Dynamiczna lista kart z trybem edycji inline. Karty zmieniają kolory w zależności od statusu (zielony dla zatwierdzonych, czerwony dla odrzuconych).
    - `Skeleton`: Stan ładowania podczas pracy LLM.
- **UX, dostępność i bezpieczeństwo**:
    - Synchronizacja propozycji AI z `sessionStorage` (ochrona przed odświeżeniem).
    - `beforeunload`: Ostrzeżenie przed wyjściem z niezapisanymi fiszkami.
    - Blokada przycisków zapisu bulk podczas aktywnej edycji inline. Po edycji propozycja fiszki wciąz musi spełniać wymógl liczby znaków - do 200 dla przodu i 500 dla tyłu fiszki. 

### Widok: Moje fiszki (Biblioteka)
- **Ścieżka**: `/flashcards`
- **Główny cel**: Przeglądanie, edycja i usuwanie zapisanych fiszek.
- **Kluczowe informacje**: Lista wszystkich kart (przód i tył widoczne jednocześnie).
- **Kluczowe komponenty**: 
    - `DataView`: Grid/Lista kart.
    - `Dialog`: Formularz edycji istniejącej fiszki.
    - `AlertDialog`: Potwierdzenie usunięcia fiszki.
- **UX, dostępność i bezpieczeństwo**:
    - Brak animacji obracania (szybki skan wzrokowy treści).


### Widok: Sesja nauki
- **Ścieżka**: `/session`
- **Główny cel**: Aktywna nauka metodą spaced repetition (FSRS).
- **Kluczowe informacje**: Licznik postępu, karta 3D, przyciski oceny algorytmu.
- **Kluczowe komponenty**: 
    - `StudyCard`: Komponent 3D z animacją flip.
    - `FSRSButtonGroup`: Cztery przyciski ocen (Again, Hard, Good, Easy).
    - `Progress`: Pasek postępu sesji.
- **UX, dostępność i bezpieczeństwo**:
    - Obsługa klawiatury: `Spacja` (obrót), `1-4` (oceny).
    - Widok "distraction-free" (ukrycie zbędnych elementów interfejsu).

### Widok: Profil i Ustawienia
- **Ścieżka**: `/profile`
- **Główny cel**: Zarządzanie kontem i bezpieczeństwem danych.
- **Kluczowe informacje**: Dane użytkownika, zmiana hasła, usuwanie konta.
- **Kluczowe komponenty**: 
    - `AlertDialog`: Potwierdzenie usunięcia konta (RODO).
- **UX, dostępność i bezpieczeństwo**:
    - Jasne ostrzeżenia o nieodwracalności usunięcia danych.

## 3. Mapa podróży użytkownika

1.  **Start**: Użytkownik loguje się i trafia na `/generate`.
2.  **Tworzenie (AI)**:
    - Wkleja tekst (np. 5000 znaków).
    - Klika "Generuj" -> Widzi Skeleton -> Otrzymuje listę 8 propozycji.
    - Przegląda propozycje: jedną odrzuca (karta staje się czerwona), jedną zatwierdza (karta staje się zielona), jedną edytuje inline.
    - Klika "Zapisz nieodrzucone" -> Otrzymuje Toast z potwierdzeniem -> Nieodrzucone propozycje zostają zapisane, a wszystkie znikają z listy (odrzucone są usuwane).
3.  **Tworzenie (Manual)**:
    - Przełącza zakładkę na "Ręczne".
    - Wpisuje przód i tył z widocznym licznikiem znaków.
    - Zapisuje fiszkę.
4.  **Zarządzanie**:
    - Przechodzi do "Moje fiszki", aby przejrzeć nowo dodane karty.
    - Poprawia błąd w jednej z kart poprzez Dialog edycji.
5.  **Nauka**:
    - Klika "Sesja nauki".
    - Przechodzi przez 10 kart, używając skrótów klawiaturowych.
    - Po zakończeniu widzi podsumowanie (opcjonalne) lub wraca do Generate.

## 4. Układ i struktura nawigacji

### Topbar (Desktop)
- **Pozycja**: `sticky top-0`, `z-50`, `backdrop-blur`.
- **Elementy**: 
    - Menu: Generuj, Moje fiszki, Sesja nauki, Profil.
    - Przycisk: Wyloguj.

### Navigation Drawer (Mobile)
- **Trigger**: Przycisk hamburger w Topbarze.
- **Komponent**: `Sheet` (lewa lub prawa strona).
- **Elementy**: Pionowa lista linków + przycisk wylogowania na dole panelu.

## 5. Kluczowe komponenty

1.  **`FlashcardProposal`**: Karta używana w procesie recenzji AI. Wykorzystuje model `FlashcardProposalViewModel` do zarządzania stanem akceptacji i edycji. Zawiera dwa stany: wyświetlanie i edycja inline. Obsługuje przyciski Akceptuj/Edytuj/Odrzuć. Znajduje sie w `/generate` w domyślnej zakładce AI, poniżej formularza generacji. 
2.  **`CharacterCounter`**: Mały komponent tekstowy pod polami `input/textarea`, zmieniający kolor na czerwony po przekroczeniu limitu (200 dla frontu, 500 dla tyłu).
3.  **`StudyCard`**: Zaawansowany komponent CSS 3D obsługujący stan `isFlipped`. Zapewnia płynną animację i czytelność tekstu po obu stronach.
4.  **`StatusToast`**: Globalny system powiadomień o sukcesach (np. "Zapisano 7 fiszek"),
błędy wyświetlane inline.
5.  **`BulkActionToolbar`**: Pasek narzędziowy widoczny pod listą propozycji AI, zawierający przyciski "Zapisz nieodrzucone" (zapisuje status `accepted` i `pending`) oraz "Zapisz zatwierdzone" (zapisuje tylko status `accepted`).
