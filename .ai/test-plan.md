# Plan Testów - Flashcard Builder MVP

## 1. Wprowadzenie i cele testowania
Celem niniejszego planu jest zapewnienie jakości aktualnie zaimplementowanych modułów aplikacji Flashcard Builder MVP. Skupiamy się na weryfikacji fundamentów systemu: autentykacji, generowania fiszek przez AI oraz manualnego tworzenia fiszek. Plan zostanie rozszerzony w miarę implementacji kolejnych funkcji (sesja nauki, zarządzanie biblioteką).

**Cele szczegółowe:**
- Weryfikacja poprawności integracji z OpenRouter API i stabilności generowania treści przez LLM.
- Zapewnienie bezpieczeństwa danych użytkowników (izolacja danych przez Supabase RLS przy zapisie).
- Potwierdzenie poprawnego działania formularzy manualnego tworzenia fiszek.
- Gwarancja responsywności kluczowych widoków (Logowanie, Rejestracja, Panel Generowania).

## 2. Zakres testów
### Funkcje objęte testami (Zaimplementowane):
- Rejestracja, logowanie i zarządzanie sesją (Supabase Auth).
- Resetowanie i zmiana hasła.
- Proces generowania fiszek przez AI (walidacja tekstu, parsowanie odpowiedzi, edycja propozycji przed zapisem).
- Masowe operacje na propozycjach AI (BulkActionToolbar - akceptacja, odrzucanie, zapis zbiorczy).
- Ręczne tworzenie nowych fiszek (formularz z licznikami znaków).
- Procedura trwałego usuwania konta.

### Funkcje wyłączone z zakresu (Jeszcze niezaimplementowane):
- **Sesja nauki (Spaced Repetition):** Brak widoku sesji i integracji z algorytmem.
- **Zarządzanie biblioteką:** Brak widoku listy wszystkich fiszek, edycji i usuwania już zapisanych kart.
- **Statystyki:** Brak widoku podsumowującego efektywność AI dla użytkownika.
- Importowanie plików zewnętrznych (PDF, DOCX).

## 3. Typy testów do przeprowadzenia
1. **Testy jednostkowe (Unit Tests):**
   - Walidatory formularzy (e-mail, hasło, limity znaków w fiszkach).
   - Funkcje pomocnicze w `generation.service.ts` (np. parsowanie JSON z LLM).
   - Komponenty UI w izolacji (np. `CharacterCounter`, `ProposalItem`).
2. **Testy integracyjne (Integration Tests):**
   - Komunikacja Frontend <-> API (generowanie i zapisywanie).
   - Testy RLS (Row Level Security) dla operacji INSERT w tabelach `flashcards` i `generations`.
3. **Testy end-to-end (E2E):**
   - Ścieżka: Rejestracja -> Login -> Wklejenie tekstu -> Generowanie -> Zapis propozycji.
   - Ścieżka: Manualne utworzenie fiszki -> Walidacja licznika -> Zapis.
4. **Testy użyteczności (UX) i responsywności:**
   - Weryfikacja `MobileNav` oraz przyklejonego paska `BulkActionToolbar` na urządzeniach mobilnych.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### ST-01: Proces generowania AI i zapisywania
- **Warunek wstępny:** Użytkownik zalogowany, tekst źródłowy 2000 znaków.
- **Kroki:** Wklejenie tekstu -> Kliknięcie generuj -> Oczekiwanie na propozycje -> Edycja jednej propozycji -> Kliknięcie "Zapisz zatwierdzone".
- **Oczekiwany rezultat:** Propozycje znikają z widoku sesji, pojawia się komunikat o sukcesie (Toast). Baza danych zawiera nowe rekordy z poprawnym `user_id` i `source`.

### ST-02: Bezpieczeństwo zapisu (RLS)
- **Kroki:** Próba wysłania żądania POST do `/api/flashcards` z danymi innego użytkownika w body (jeśli API by na to pozwalało) lub bez autentykacji.
- **Oczekiwany rezultat:** Odrzucenie żądania przez API (401 Unauthorized) lub zablokowanie zapisu przez polityki RLS w Supabase (brak uprawnień do zapisu dla innego `user_id`).

### ST-03: Procedura usuwania konta (RODO)
- **Kroki:** Wejście w profil -> Kliknięcie "Usuń konto" -> Potwierdzenie w modalu.
- **Oczekiwany rezultat:** Wszystkie dane użytkownika (w tym fiszki) zostają usunięte. Przekierowanie na stronę logowania. Brak możliwości ponownego zalogowania na to samo konto.

## 5. Środowisko testowe
- **Development:** Lokalny serwer Astro, lokalna instancja Supabase (Docker).
- **Staging:** Środowisko identyczne z produkcyjnym (DigitalOcean App Platform) z oddzielną bazą danych.
- **Przeglądarki:** Chrome (najnowsza), Firefox, Safari (mobile), Edge.

## 6. Narzędzia do testowania
- **Vitest & React Testing Library:** Testy jednostkowe i komponentów.
- **Playwright:** Testy E2E oraz testy wizualne (Visual Regression).
- **Postman/Insomnia:** Testowanie endpointów API.
- **GitHub Actions:** Automatyczne uruchamianie testów przy każdym Pull Request.
- **Sentry (opcjonalnie):** Monitorowanie błędów na środowisku staging/produkcyjnym.

## 7. Harmonogram testów
| Faza | Zadanie | Czas trwania |
| :--- | :--- | :--- |
| Przygotowanie | Konfiguracja Vitest i Playwright | 2 dni |
| Testy Jednostkowe | Pokrycie kluczowych serwisów i komponentów | 4 dni |
| Testy Integracyjne | Testy API i Supabase RLS | 3 dni |
| Testy E2E | Implementacja kluczowych scenariuszy (Happy Path) | 3 dni |
| Bug Fixing | Naprawa wykrytych błędów i retesty | Ciągły |

## 8. Kryteria akceptacji testów
- 100% testów E2E dla ścieżek krytycznych (logowanie, rejestracja, generowanie i tworzenie fiszek) musi zakończyć się sukcesem.
- Brak błędów o priorytecie "Blocker" i "Critical" w raporcie końcowym.
- Pokrycie kodu testami jednostkowymi (Code Coverage) na poziomie min. 70% dla folderu `src/lib/services`.
- Poprawna walidacja wszystkich pól formularzy zgodnie z dokumentacją PRD.

## 9. Role i odpowiedzialności
- **QA Engineer:** Tworzenie scenariuszy, implementacja testów automatycznych, raportowanie błędów.
- **Developer:** Naprawa błędów, pisanie testów jednostkowych dla nowej funkcjonalności.
- **Product Owner:** Akceptacja wyników testów, weryfikacja zgodności z wymaganiami biznesowymi.

## 10. Procedury raportowania błędów
Wszystkie błędy należy zgłaszać w systemie GitHub Issues, stosując szablon:
1. **Tytuł:** Krótki opis (np. [BUG] Błąd walidacji hasła).
2. **Opis:** Co się stało i co było oczekiwane.
3. **Kroki do reprodukcji:** Lista ponumerowana.
4. **Środowisko:** Przeglądarka, system operacyjny.
5. **Priorytet:** Low / Medium / High / Blocker.
6. **Załączniki:** Zrzuty ekranu lub logi z konsoli.
