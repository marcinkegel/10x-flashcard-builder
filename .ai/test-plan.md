# Plan Testów - Flashcard Builder MVP

## 1. Wprowadzenie i cele testowania
Celem niniejszego planu jest zapewnienie jakości aktualnie zaimplementowanych modułów aplikacji Flashcard Builder MVP. Skupiamy się na weryfikacji fundamentów systemu: autentykacji, generowania fiszek przez AI, manualnego tworzenia fiszek oraz zarządzania biblioteką fiszek. Plan zostanie rozszerzony w miarę implementacji kolejnych funkcji (sesja nauki).

**Cele szczegółowe:**
- Weryfikacja poprawności integracji z OpenRouter API i stabilności generowania treści przez LLM.
- Zapewnienie bezpieczeństwa danych użytkowników (izolacja danych przez Supabase RLS przy odczycie, zapisie, edycji i usuwaniu).
- Potwierdzenie poprawnego działania formularzy manualnego tworzenia i edycji fiszek.
- Gwarancja responsywności kluczowych widoków (Logowanie, Rejestracja, Panel Generowania, Biblioteka).
- Weryfikacja poprawności paginacji i synchronizacji stanu w widoku biblioteki.

## 2. Zakres testów
### Funkcje objęte testami (Zaimplementowane):
- Rejestracja, logowanie i zarządzanie sesją (Supabase Auth).
- Resetowanie i zmiana hasła.
- Proces generowania fiszek przez AI (walidacja tekstu, parsowanie odpowiedzi, edycja propozycji przed zapisem).
- Masowe operacje na propozycjach AI (BulkActionToolbar - akceptacja, odrzucanie, zapis zbiorczy).
- Ręczne tworzenie nowych fiszek (formularz z licznikami znaków).
- Zarządzanie biblioteką fiszek (przeglądanie listy z paginacją, edycja treści, usuwanie).
- Procedura trwałego usuwania konta.

### Funkcje wyłączone z zakresu (Jeszcze niezaimplementowane):
- **Sesja nauki (Spaced Repetition):** Brak widoku sesji i integracji z algorytmem.
- **Statystyki:** Brak widoku podsumowującego efektywność AI dla użytkownika.
- Importowanie plików zewnętrznych (PDF, DOCX).

## 3. Typy testów do przeprowadzenia

### 1. Testy jednostkowe (Unit Tests)
**Framework:** Vitest + Happy-DOM  
**Zakres:** Izolowane funkcje i klasy bez zależności zewnętrznych  
**Lokalizacja:** `src/**/__tests__/*.test.ts`

**Co testujemy:**
- ✅ **Serwisy logiki biznesowej:**
  - `generation.service.ts` - generateHash, checkDuplicate, error handling
  - `openrouter.service.ts` - buildRequestPayload, handleApiResponse, retry logic
  - `flashcard.service.ts` - CRUD operations, validation
- ✅ **Funkcje pomocnicze:**
  - Walidatory (email, password, character limits)
  - Parsery (JSON parsing z LLM response)
  - Formatery (daty, liczby)
- ✅ **Hooks React:**
  - `useGenerationSession.ts` - state management logika
- ✅ **Komponenty UI w izolacji:**
  - `CharacterCounter.tsx` - licznik i kolorowanie
  - `ProposalItem.tsx` - interakcje bez API
  
**Mocking:** Supabase client, fetch, external dependencies  
**Target coverage:** 70% dla `src/lib/`, 60% dla `src/components/`

### 2. Testy komponentów (Component Tests)
**Framework:** Vitest + React Testing Library  
**Zakres:** Komponenty React z interakcjami użytkownika  
**Lokalizacja:** `src/components/**/__tests__/*.test.tsx`

**Co testujemy:**
- ✅ **Renderowanie:** Czy komponent wyświetla poprawne dane
- ✅ **Interakcje:** Click, input change, form submit
- ✅ **Warunki:** Conditional rendering (loading, empty state)
- ✅ **Props:** Różne kombinacje props i ich efekty
- ✅ **Accessibility:** ARIA labels, keyboard navigation

**Przykłady:**
- `LoginForm.tsx` - walidacja formularza, submit handling
- `FlashcardItem.tsx` - edit/delete actions, optimistic updates
- `BulkActionToolbar.tsx` - masowe akcje, disabled states
- `EmptyState.tsx` - wyświetlanie komunikatów

**Nie mockujemy:** React hooks (useState, useEffect)  
**Mockujemy:** API calls, routing, external services

### 3. Testy integracyjne (Integration Tests)
**Framework:** Vitest + Test Database  
**Zakres:** Komunikacja między warstwami (Frontend ↔ API ↔ Database)  
**Lokalizacja:** `tests/integration/*.test.ts`

**Co testujemy:**
- ✅ **API Endpoints:**
  - Request/Response flow
  - HTTP status codes (200, 201, 400, 401, 404)
  - Payload validation
  - Error handling
- ✅ **Database Operations:**
  - INSERT, UPDATE, DELETE, SELECT
  - Transactions i rollbacks
  - Constraints (unique, foreign keys)
- ✅ **Row Level Security (RLS):**
  - User isolation
  - Unauthorized access attempts
  - Cross-user data leaks

**Setup:** Test Supabase instance z migrations, test users  
**Cleanup:** Rollback transactions lub DELETE test data after each test

### 4. Testy end-to-end (E2E Tests)
**Framework:** Playwright  
**Zakres:** Pełne user journeys w przeglądarce  
**Lokalizacja:** `tests/e2e/*.spec.ts`

**Co testujemy:**
- ✅ **Critical User Paths:**
  - Registration → Email confirmation → Login → Dashboard
  - Login → Generate flashcards → Edit → Save → View in library
  - Login → Manual create → Validate → Save
  - Login → Library → Edit → Delete → Pagination
- ✅ **Navigation:** Routing, redirects, back button
- ✅ **Forms:** Full form workflows z walidacją
- ✅ **Error Scenarios:** Network errors, API failures, validation errors
- ✅ **Responsiveness:** Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)

**Environment:** Dev server running (`npm run dev` on localhost:4321)  
**Mocking:** External APIs (OpenRouter) dla stabilności  
**Artifacts:** Screenshots on failure, video recordings, trace files

### 5. Testy manualne (Manual Testing)
**Kiedy:** Przed każdym release, dla nowych features bez automated testów  
**Kto:** QA Engineer lub Developer

**Checklist:**
- [ ] Testy eksploracyjne (edge cases, creative scenarios)
- [ ] Browser testing (Chrome only)
- [ ] Mobile devices testing (Chrome Mobile emulation)
- [ ] Accessibility testing (screen readers, keyboard only)
- [ ] Performance testing (Lighthouse scores, load times)
- [ ] Security testing (SQL injection, XSS, CSRF)

### 6. Testy regresji (Regression Tests)
**Trigger:** Po każdym bug fixie  
**Proces:**
1. Bug jest znaleziony i zgłoszony
2. Developer pisze failing test reprodukujący bug
3. Developer fixuje bug
4. Test przechodzi
5. Test pozostaje w suite jako regression guard

**Lokalizacja:** Wszędzie (unit, integration, E2E)  
**Tag:** `@regression` w opisie testu

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### ST-01: Proces generowania AI i zapisywania
- **Warunek wstępny:** Użytkownik zalogowany, tekst źródłowy min. 100 znaków (zgodnie z walidacją frontendu).
- **Kroki:** 
  1. Użytkownik wkleja tekst źródłowy (2000 znaków) w textarea.
  2. Sprawdza licznik znaków (powinien wyświetlać 2000/10000).
  3. Klika przycisk "Generuj fiszki".
  4. Obserwuje loading state (spinner lub skeleton).
  5. Po 5-30s (w zależności od API) widzi listę 5-10 propozycji.
  6. Klika ikonę edycji przy pierwszej propozycji.
  7. Modyfikuje treść przodu fiszki w dialogu.
  8. Zapisuje zmiany w dialogu.
  9. Zaznacza checkboxy przy 3 propozycjach (w tym edytowanej).
  10. Klika "Zapisz zatwierdzone" w `BulkActionToolbar`.
- **Oczekiwany rezultat:** 
  - Propozycje znikają z widoku sesji generowania.
  - Toast sukcesu: "Zapisano 3 fiszki do biblioteki".
  - W bazie danych tabela `flashcards` zawiera 3 nowe rekordy:
    - Poprawny `user_id` (zgodny z zalogowanym użytkownikiem).
    - `source` = `"ai-full"` dla 2 nieedytowanych i `"ai-edited"` dla 1 edytowanej.
    - `generation_id` wskazuje na rekord w tabeli `generations`.
  - Tabela `generations` ma zaktualizowany `count_accepted_edited` = 1 i `count_accepted_unedited` = 2.
  - Przekierowanie do `/flashcards` (biblioteka) gdzie widać nowe fiszki.
- **Uwagi techniczne:**
  - Test E2E powinien mockować OpenRouter API (MSW) dla przewidywalności.
  - Test integracyjny powinien używać prawdziwego API (z limitem rate).

### ST-02: Bezpieczeństwo zapisu (RLS)
- **Cel:** Weryfikacja izolacji danych użytkowników przez Row Level Security.
- **Warunki wstępne:** Test database z włączonymi politykami RLS.
- **Kroki testowe:**
  1. **Test API bez autentykacji:** Próba POST do `/api/flashcards` bez nagłówka Authorization.
  2. **Test próby zapisu dla innego użytkownika:** Próba manipulacji `user_id` w payloadzie.
  3. **Test bezpośredniego zapytania SQL:** Użycie Supabase client z różnymi rolami użytkownika.
- **Oczekiwany rezultat:** 
  - API zwraca 401 Unauthorized dla żądań bez autentykacji.
  - Polityka RLS blokuje INSERT z niepoprawnym `user_id` (brak uprawnień).
  - Użytkownik widzi tylko swoje rekordy w SELECT queries.
- **Implementacja testowa:**
  ```typescript
  // tests/integration/rls.test.ts
  describe('RLS Security', () => {
    it('should reject unauthenticated flashcard creation', async () => {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        body: JSON.stringify({ front: 'Q', back: 'A' }),
        headers: { 'Content-Type': 'application/json' }
      });
      expect(response.status).toBe(401);
    });

    it('should prevent cross-user data access', async () => {
      const supabase = createTestClient({ userId: 'user-a' });
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', 'user-b'); // Próba dostępu do danych innego użytkownika
      
      expect(data).toHaveLength(0); // RLS filtruje wyniki
    });
  });
  ```

### ST-03: Zarządzanie biblioteką (Edycja i Usuwanie)
- **Warunek wstępny:** Użytkownik posiada co najmniej 5 zapisanych fiszek w bibliotece.
- **Kroki - Edycja:** 
  1. Wejście w "Moje fiszki" (`/flashcards`).
  2. Przewinięcie listy i zlokalizowanie fiszki do edycji.
  3. Kliknięcie ikony edycji (ołówek) na karcie fiszki.
  4. Dialog edycji otwiera się z wypełnionymi polami.
  5. Zmiana treści przodu z "Pytanie A" na "Pytanie A (Zaktualizowane)".
  6. Zmiana treści tyłu z "Odpowiedź A" na "Odpowiedź A (Rozszerzona)".
  7. Kliknięcie "Zapisz zmiany".
- **Oczekiwany rezultat po edycji:** 
  - Dialog zamyka się natychmiast.
  - Lokalny stan karty aktualizuje się PRZED response z API (optimistic update).
  - Toast sukcesu: "Fiszka zaktualizowana".
  - Request `PUT /api/flashcards/[id]` z body zawierającym nowe wartości.
  - W bazie danych:
    - Pole `front` i `back` są zaktualizowane.
    - Jeśli fiszka miała `source = "ai-full"`, zmienia się na `source = "ai-edited"`.
    - Pole `updated_at` jest ustawione na aktualny timestamp.
  - Po odświeżeniu strony zmiany są persystentne.

- **Kroki - Usuwanie:**
  1. Kliknięcie ikony usuwania (kosz) na karcie fiszki.
  2. Dialog potwierdzenia: "Czy na pewno chcesz usunąć tę fiszkę?"
  3. Kliknięcie "Tak, usuń".
- **Oczekiwany rezultat po usunięciu:** 
  - Dialog zamyka się.
  - Karta znika z listy natychmiast (optimistic update).
  - Toast sukcesu: "Fiszka usunięta".
  - Request `DELETE /api/flashcards/[id]`.
  - W bazie danych: rekord jest usuwany (hard delete, nie soft delete).
  - Paginacja przelicza się automatycznie:
    - Jeśli usunięto ostatnią fiszkę na stronie, redirect na poprzednią stronę.
    - Licznik "Wszystkich fiszek" zmniejsza się o 1.
  - Po odświeżeniu fiszka nie wraca na listę.

- **Przypadki brzegowe do przetestowania:**
  - Edycja fiszki podczas gdy inny użytkownik ją usuwa (race condition) → błąd 404.
  - Usuwanie wszystkich fiszek → wyświetlenie `EmptyState`.
  - Edycja z pustym polem → walidacja i błąd "Pole nie może być puste".

### ST-04: Procedura usuwania konta (RODO)
- **Warunek wstępny:** Użytkownik zalogowany z aktywnym kontem zawierającym dane (fiszki, generacje).
- **Kroki:** 
  1. Wejście w profil użytkownika (`/profile`).
  2. Przewinięcie do sekcji "Strefa niebezpieczna".
  3. Kliknięcie przycisku "Usuń konto na stałe".
  4. Dialog ostrzegawczy wyświetla się z informacją o nieodwracalności akcji.
  5. Użytkownik wpisuje potwierdzenie (np. swój email) w polu tekstowym.
  6. Kliknięcie "Tak, usuń moje konto i wszystkie dane".
  7. Request `DELETE /api/auth/delete-account` jest wysyłany.
- **Oczekiwany rezultat:** 
  - Loading state podczas przetwarzania (przycisk disabled, spinner).
  - Po sukcesie:
    - Wszystkie dane użytkownika są usuwane z bazy Supabase:
      - Tabela `flashcards` - wszystkie rekordy z `user_id`.
      - Tabela `generations` - wszystkie rekordy z `user_id`.
      - Tabela `generation_error_logs` - wszystkie rekordy z `user_id`.
      - Tabela `auth.users` - rekord użytkownika (Supabase Auth).
    - Sesja użytkownika jest zakończona (logout).
    - Redirect na `/` (strona główna) lub `/login`.
    - Toast info: "Twoje konto i dane zostały trwale usunięte".
  - Próba ponownego zalogowania na usunięte konto:
    - Błąd autentykacji: "Nieprawidłowy email lub hasło".
  - Brak możliwości odzyskania konta lub danych (zgodnie z RODO - right to erasure).
  
- **Przypadki brzegowe:**
  - Użytkownik anuluje akcję w dialogu → dane NIE są usuwane.
  - Błąd sieci podczas usuwania → rollback transakcji, dane pozostają.
  - Próba usunięcia konta bez autentykacji → 401 Unauthorized.

- **Uwagi techniczne:**
  - Operacja powinna być atomic (transakcja DB).
  - Log audytowy: zapisanie informacji o usunięciu konta (email, timestamp) do osobnej tabeli audytowej (opcjonalnie, dla zgodności z przepisami).
  - Test E2E powinien używać test usera, nie production data.

## 5. Środowisko testowe
- **Development:** Lokalny serwer Astro (`npm run dev`), lokalna instancja Supabase (Docker lub hosted).
- **Test Database:** Osobna instancja Supabase dla testów integracyjnych z RLS policies.
- **Staging:** Środowisko identyczne z produkcyjnym (np. DigitalOcean App Platform, Vercel) z oddzielną bazą danych.
- **Przeglądarki:** 
  - Desktop: Chrome (latest)
  - Mobile: Chrome Android (emulation)
- **Node.js:** v20.x (zgodnie z `.nvmrc`)
- **OS:** Windows 11, macOS, Linux (Ubuntu 22.04+)

## 5a. Ograniczenia i założenia

### Ograniczenia techniczne:
1. **Brak frameworków testowych** - Projekt nie ma obecnie zainstalowanych Vitest ani Playwright. Implementacja testów wymaga najpierw konfiguracji środowiska (5-7 dni).

2. **OpenRouter API Rate Limits** - Bezpłatny tier OpenRouter ma limity:
   - Max 10 requests/minute
   - Max 100 requests/day
   - Testy E2E z prawdziwym API będą powolne i ograniczone
   - **Rozwiązanie:** Mockowanie OpenRouter w testach E2E (MSW), testy integracyjne z limitem daily runs

3. **Supabase RLS w testach** - Testowanie Row Level Security wymaga:
   - Test database z włączonymi RLS policies
   - Mockowanie różnych user contexts
   - Niemożliwe w pełni w unit testach (wymaga integracji)

4. **Astro SSR testing** - Astro 5 z SSR wymaga specjalnej konfiguracji:
   - Standard testing tools są dla CSR (Client-Side Rendering)
   - API routes wymagają testów integracyjnych, nie jednostkowych
   - Components z Astro islands wymagają osobnego setupu

5. **GitHub Actions Minutes** - Darmowe konto GitHub:
   - 2000 minut/miesiąc dla private repo
   - Playwright testy mogą zużyć 5-10 minut per run
   - ~200-400 runs/miesiąc (wystarczające dla MVP)

### Założenia:
1. **Test Data Management** - Każdy test tworzy i usuwa własne dane (izolacja).
2. **Network Mocking** - E2E testy domyślnie mockują external APIs dla szybkości.
3. **Authentication** - Test users są tworzeni automatycznie w setupie testowym.
4. **Database Migrations** - Test DB jest resetowana przed każdym integration test run.
5. **CI/CD** - Testy uruchamiają się automatycznie tylko dla PR do `main` branch.
6. **Parallel Execution** - Unit testy w parallel, E2E sequential (ze względu na DB state).
7. **Timeouts** - OpenRouter calls mają timeout 30s, inne API 5s.

### Ryzyka i mitygacja:
| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
| :--- | :--- | :--- | :--- |
| OpenRouter rate limit w testach | Wysokie | Średni | Mock API w E2E, limit integration tests |
| Flaky E2E tests (timing issues) | Średnie | Średni | Proper waits, retry logic, stable selectors |
| Test database nie sync z production schema | Średnie | Wysoki | Supabase migrations w CI, validation |
| Długi czas wykonania testów (>10 min) | Średnie | Niski | Parallel execution, selective test runs |
| Brak doświadczenia zespołu z Playwright | Niskie | Średni | Dokumentacja, pair programming, templates |

## 6. Narzędzia do testowania

### Obecny stan projektu:
- ❌ **Brak frameworków testowych** - Vitest, Playwright nie są zainstalowane
- ✅ **ESLint i Prettier** - statyczna analiza kodu
- ✅ **Husky + lint-staged** - pre-commit hooks dla jakości kodu
- ✅ **TypeScript** - type checking w compile time

### Wymagane instalacje i konfiguracja:

#### Testy jednostkowe i integracyjne:
- **Vitest** - test runner kompatybilny z Vite/Astro
- **@testing-library/react** - testowanie komponentów React
- **@testing-library/user-event** - symulacja interakcji użytkownika
- **happy-dom** lub **jsdom** - DOM environment dla testów Node.js

#### Testy E2E:
- **Playwright** - framework do testów end-to-end
- **@playwright/test** - test runner z assertion library

#### Mocking i utilities:
- **msw** (Mock Service Worker) - mockowanie API requests
- **vitest-mock-extended** - zaawansowane mockowanie dla TypeScript
- **dotenv** - zarządzanie zmiennymi środowiskowymi w testach

#### Narzędzia pomocnicze:
- **Postman/Insomnia** - manualne testowanie endpointów API
- **GitHub Actions** - automatyczne uruchamianie testów w CI/CD
- **Sentry (opcjonalnie)** - monitorowanie błędów na staging/produkcji

## 6a. Konfiguracja środowiska testowego

### Krok 1: Instalacja zależności testowych
```bash
# Vitest i testing utilities
npm install -D vitest @vitest/ui happy-dom

# React Testing Library
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom

# Playwright
npm install -D @playwright/test

# Mocking
npm install -D msw vitest-mock-extended

# Coverage
npm install -D @vitest/coverage-v8
```

### Krok 2: Konfiguracja Vitest (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.config.*', '**/node_modules/**', '**/.astro/**'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### Krok 3: Konfiguracja Playwright (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Krok 4: Setup plików testowych
Utworzenie struktury katalogów:
```
src/
  test/
    setup.ts              # Global test setup
    mocks/
      supabase.mock.ts    # Mock Supabase client
      flashcard.fixtures.ts # Test fixtures
tests/
  e2e/
    auth.spec.ts          # E2E testy autentykacji
    generation.spec.ts    # E2E testy generowania
  integration/
    api.test.ts           # Testy API endpoints
```

### Krok 5: Dodanie skryptów do `package.json`
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## 7. Harmonogram testów (zaktualizowany)
| Faza | Zadanie | Czas trwania | Uwagi |
| :--- | :--- | :--- | :--- |
| **Setup** | Instalacja narzędzi i konfiguracja | 3-5 dni | Vitest, Playwright, MSW, struktura katalogów |
| **Unit Tests - Serwisy** | Pokrycie `src/lib/services/` | 5-7 dni | Cel: 70%+ coverage, priorytet: generation.service.ts |
| **Unit Tests - Utils** | Walidatory i helpery | 2-3 dni | Parsowanie, walidacja formularzy |
| **Component Tests** | Komponenty React w izolacji | 3-4 dni | Testing Library, focus: ProposalItem, FlashcardItem |
| **Integration Tests - API** | Endpointy `/api/*` | 3-4 dni | Mock Supabase, testy CRUD operations |
| **Integration Tests - RLS** | Bezpieczeństwo bazy danych | 2-3 dni | Wymaga test database, SQL fixtures |
| **E2E Tests - Critical Paths** | Kluczowe ścieżki użytkownika | 4-5 dni | Login → Generate → Save, Manual Creation |
| **E2E Tests - Edge Cases** | Scenariusze błędów i walidacji | 2-3 dni | Network errors, rate limits, validation |
| **Bug Fixing & Retests** | Naprawa wykrytych błędów | Ciągły | Równolegle z rozwojem |
| | | | |
| **SUMA (optymistycznie)** | | **24-34 dni roboczych** | ~5-7 tygodni przy pełnym zaangażowaniu |

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

## 11. Przykłady implementacji testów

### Przykład 1: Test jednostkowy serwisu generowania

```typescript
// src/lib/services/__tests__/generation.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerationService } from '../generation.service';
import { createMockSupabaseClient } from '@/test/mocks/supabase.mock';

describe('GenerationService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  const userId = 'test-user-123';

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  describe('generateHash', () => {
    it('should generate consistent MD5 hash from text', async () => {
      const text = "Sample educational text";
      // Access private method through bracket notation for testing
      const hash = await GenerationService['generateHash'](text);
      
      expect(hash).toHaveLength(32); // MD5 hash is always 32 characters
      expect(hash).toMatch(/^[a-f0-9]{32}$/); // Hex format
    });

    it('should generate same hash for same text', async () => {
      const text = "Consistent text";
      const hash1 = await GenerationService['generateHash'](text);
      const hash2 = await GenerationService['generateHash'](text);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('checkDuplicate', () => {
    it('should return true when duplicate exists', async () => {
      const hash = 'abc123';
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ 
          data: { id: 'gen-123' }, 
          error: null 
        })
      });

      const isDuplicate = await GenerationService['checkDuplicate'](
        mockSupabase, 
        userId, 
        hash
      );

      expect(isDuplicate).toBe(true);
    });

    it('should return false when no duplicate found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      });

      const isDuplicate = await GenerationService['checkDuplicate'](
        mockSupabase, 
        userId, 
        'new-hash'
      );

      expect(isDuplicate).toBe(false);
    });
  });

  describe('generateFlashcards', () => {
    it('should throw error for duplicate content', async () => {
      const command = { source_text: 'Test text' };
      
      // Mock duplicate check to return true
      vi.spyOn(GenerationService as any, 'checkDuplicate')
        .mockResolvedValue(true);

      await expect(
        GenerationService.generateFlashcards(mockSupabase, userId, command)
      ).rejects.toMatchObject({
        code: 'DUPLICATE_GENERATION',
        message: expect.stringContaining('przetworzony')
      });
    });
  });
});
```

### Przykład 2: Test komponentu React

```typescript
// src/components/features/flashcards/__tests__/ProposalItem.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProposalItem } from '../ProposalItem';
import type { GenerationProposalDTO } from '@/types';

describe('ProposalItem', () => {
  const mockProposal: GenerationProposalDTO = {
    proposal_id: 'ai-1234-1',
    front: 'Co to jest React?',
    back: 'Biblioteka JavaScript do tworzenia UI',
    status: 'pending'
  };

  it('should render proposal content', () => {
    render(
      <ProposalItem 
        proposal={mockProposal} 
        onEdit={vi.fn()} 
        onAccept={vi.fn()} 
        onReject={vi.fn()} 
      />
    );

    expect(screen.getByText('Co to jest React?')).toBeInTheDocument();
    expect(screen.getByText('Biblioteka JavaScript do tworzenia UI')).toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(
      <ProposalItem 
        proposal={mockProposal} 
        onEdit={onEdit} 
        onAccept={vi.fn()} 
        onReject={vi.fn()} 
      />
    );

    const editButton = screen.getByLabelText(/edytuj/i);
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockProposal);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onAccept when accept button clicked', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();

    render(
      <ProposalItem 
        proposal={mockProposal} 
        onEdit={vi.fn()} 
        onAccept={onAccept} 
        onReject={vi.fn()} 
      />
    );

    const acceptButton = screen.getByLabelText(/zatwierdź/i);
    await user.click(acceptButton);

    expect(onAccept).toHaveBeenCalledWith(mockProposal.proposal_id);
  });

  it('should disable buttons when proposal is accepted', () => {
    const acceptedProposal = { ...mockProposal, status: 'accepted' };

    render(
      <ProposalItem 
        proposal={acceptedProposal} 
        onEdit={vi.fn()} 
        onAccept={vi.fn()} 
        onReject={vi.fn()} 
      />
    );

    const editButton = screen.getByLabelText(/edytuj/i);
    const acceptButton = screen.getByLabelText(/zatwierdź/i);

    expect(editButton).toBeDisabled();
    expect(acceptButton).toBeDisabled();
  });
});
```

### Przykład 3: Test E2E (Playwright)

```typescript
// tests/e2e/generation-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete generation flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login przed każdym testem
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/flashcards');
  });

  test('should generate flashcards from text', async ({ page }) => {
    // Przejdź do widoku generowania
    await page.goto('/generate');
    await expect(page.locator('h1')).toContainText('Generuj fiszki');

    // Wklej tekst źródłowy
    const sourceText = `
      React to biblioteka JavaScript stworzona przez Facebook.
      Służy do budowania interfejsów użytkownika.
      Wykorzystuje komponenty i Virtual DOM.
    `.trim();

    await page.fill('textarea[name="source_text"]', sourceText);
    
    // Sprawdź licznik znaków
    const charCounter = page.locator('[data-testid="char-counter"]');
    await expect(charCounter).toContainText(`${sourceText.length}`);

    // Kliknij "Generuj"
    await page.click('button:has-text("Generuj")');

    // Czekaj na loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

    // Czekaj na propozycje (timeout 30s dla API AI)
    await expect(page.locator('[data-testid="proposal-item"]').first())
      .toBeVisible({ timeout: 30000 });

    // Sprawdź, czy są propozycje
    const proposalCount = await page.locator('[data-testid="proposal-item"]').count();
    expect(proposalCount).toBeGreaterThan(0);
    expect(proposalCount).toBeLessThanOrEqual(10);

    // Edytuj jedną propozycję
    await page.locator('[data-testid="proposal-item"]').first()
      .locator('button[aria-label*="Edytuj"]').click();
    
    const editDialog = page.locator('[role="dialog"]');
    await expect(editDialog).toBeVisible();
    
    await page.fill('input[name="front"]', 'Co to jest React? (Edytowane)');
    await page.click('button:has-text("Zapisz")');
    await expect(editDialog).not.toBeVisible();

    // Zaznacz kilka propozycji
    await page.locator('[data-testid="proposal-checkbox"]').first().click();
    await page.locator('[data-testid="proposal-checkbox"]').nth(1).click();

    // Kliknij "Zapisz zatwierdzone"
    await page.click('button:has-text("Zapisz zatwierdzone")');

    // Czekaj na toast sukcesu
    await expect(page.locator('[role="status"]'))
      .toContainText(/zapisano/i, { timeout: 5000 });

    // Sprawdź przekierowanie do biblioteki
    await expect(page).toHaveURL('/flashcards');

    // Zweryfikuj, że fiszki są na liście
    const flashcardItems = page.locator('[data-testid="flashcard-item"]');
    await expect(flashcardItems).toHaveCount(2, { timeout: 5000 });
  });

  test('should show error for duplicate generation', async ({ page }) => {
    const duplicateText = 'This exact text was already processed';

    // Pierwsza generacja
    await page.goto('/generate');
    await page.fill('textarea[name="source_text"]', duplicateText);
    await page.click('button:has-text("Generuj")');
    await expect(page.locator('[data-testid="proposal-item"]').first())
      .toBeVisible({ timeout: 30000 });

    // Druga generacja z tym samym tekstem
    await page.goto('/generate');
    await page.fill('textarea[name="source_text"]', duplicateText);
    await page.click('button:has-text("Generuj")');

    // Oczekuj błędu o duplikacie
    await expect(page.locator('[role="alert"]'))
      .toContainText(/przetworzony/i, { timeout: 5000 });

    // Sprawdź, że nie ma propozycji
    await expect(page.locator('[data-testid="proposal-item"]')).toHaveCount(0);
  });

  test('should validate minimum text length', async ({ page }) => {
    await page.goto('/generate');
    
    // Wpisz za krótki tekst (< 100 znaków)
    await page.fill('textarea[name="source_text"]', 'Short text');
    
    // Sprawdź, czy przycisk jest disabled
    const generateButton = page.locator('button:has-text("Generuj")');
    await expect(generateButton).toBeDisabled();

    // Sprawdź komunikat walidacji
    await expect(page.locator('[data-testid="validation-error"]'))
      .toContainText(/minimum/i);
  });
});
```

### Przykład 4: Test integracyjny API

```typescript
// tests/integration/flashcards-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestSupabaseClient, cleanupTestData } from '@/test/utils/test-db';

describe('Flashcards API Integration', () => {
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Setup test user i auth token
    const result = await setupTestUser();
    testUserId = result.userId;
    authToken = result.token;
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
  });

  it('should create flashcard via API', async () => {
    const response = await fetch('http://localhost:4321/api/flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        flashcards: [{
          front: 'Test Question',
          back: 'Test Answer',
          source: 'manual'
        }]
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.flashcards).toHaveLength(1);
    expect(data.flashcards[0]).toHaveProperty('id');
  });

  it('should reject invalid flashcard data', async () => {
    const response = await fetch('http://localhost:4321/api/flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        flashcards: [{
          front: '', // Empty front - should fail validation
          back: 'Test Answer'
        }]
      })
    });

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.code).toBe('VALIDATION_ERROR');
  });
});
```

## 12. Metryki sukcesu i definicja gotowości (DoD)

### Definition of Done dla testów:
- ✅ Wszystkie testy E2E dla ścieżek krytycznych przechodzą (100% pass rate)
- ✅ Code coverage dla `src/lib/services/` ≥ 70%
- ✅ Code coverage dla `src/components/features/` ≥ 60%
- ✅ Brak błędów priorytetu "Blocker" i "Critical"
- ✅ Testy uruchamiają się w CI/CD na każdym PR
- ✅ Dokumentacja testów (README.md w katalogu tests/)
- ✅ Wszystkie testy są deterministyczne (nie flaky)
- ✅ Średni czas wykonania testów jednostkowych < 30s
- ✅ Średni czas wykonania testów E2E < 5 minut

### KPI do monitorowania:
- **Test Coverage:** Target 70% dla services, 60% dla components
- **Test Execution Time:** Max 5 minut dla pełnej suity
- **Flaky Test Rate:** Max 2% testów może być niestabilnych
- **Bug Detection Rate:** Min 80% bugów wykrytych przed production
- **Test Maintenance Cost:** Max 20% czasu developmentu na utrzymanie testów

## 13. Roadmap implementacji testów

### Faza 0: Przygotowanie (Dni 1-5)
**Cel:** Przygotowanie środowiska i infrastruktury testowej

- [ ] Instalacja Vitest, Playwright, Testing Library
- [ ] Konfiguracja `vitest.config.ts` z aliasami i coverage
- [ ] Konfiguracja `playwright.config.ts` z base URL i devices
- [ ] Utworzenie struktury katalogów (`src/test/`, `tests/e2e/`, `tests/integration/`)
- [ ] Implementacja mocków Supabase (`supabase.mock.ts`)
- [ ] Setup fixtures i test helpers
- [ ] Dodanie skryptów testowych do `package.json`
- [ ] Konfiguracja GitHub Actions workflow dla CI
- [ ] Dokumentacja: `tests/README.md` z instrukcjami uruchamiania

**Outcome:** Deweloperzy mogą uruchomić `npm run test` i zobaczyć działające środowisko

### Faza 1: Testy jednostkowe - Quick Wins (Dni 6-12)
**Cel:** Pokrycie krytycznych serwisów i utils testami jednostkowymi

**Priorytet WYSOKI:**
- [ ] `generation.service.ts` - generateHash, checkDuplicate, logError
- [ ] `openrouter.service.ts` - buildRequestPayload, handleApiResponse
- [ ] `flashcard.service.ts` - CRUD operations, validation logic
- [ ] Walidatory formularzy (email, password, character limits)
- [ ] Utils: parsowanie, formatowanie danych

**Target:** 70% coverage dla `src/lib/services/`

**Outcome:** Core business logic jest przetestowany i bezpieczny do refaktoryzacji

### Faza 2: Testy komponentów React (Dni 13-16)
**Cel:** Weryfikacja UI components w izolacji

**Priorytet WYSOKI:**
- [ ] `ProposalItem.tsx` - interakcje (edit, accept, reject)
- [ ] `FlashcardItem.tsx` - wyświetlanie i akcje
- [ ] `CharacterCounter.tsx` - logika licznika i kolorów
- [ ] `BulkActionToolbar.tsx` - masowe akcje

**Priorytet ŚREDNI:**
- [ ] Formularze: `LoginForm.tsx`, `ManualFlashcardForm.tsx`
- [ ] Dialogi: `EditFlashcardDialog.tsx`, `DeleteFlashcardDialog.tsx`

**Target:** 60% coverage dla `src/components/features/`

**Outcome:** UI jest przewidywalne i spójne z design system

### Faza 3: Testy integracyjne API (Dni 17-21)
**Cel:** Weryfikacja endpointów i komunikacji z bazą

**Priorytet WYSOKI:**
- [ ] `POST /api/generations` - generowanie fiszek
- [ ] `POST /api/flashcards` - tworzenie fiszek
- [ ] `PUT /api/flashcards/[id]` - edycja fiszki
- [ ] `DELETE /api/flashcards/[id]` - usuwanie fiszki
- [ ] `GET /api/flashcards?page=1` - paginacja

**Priorytet ŚREDNI:**
- [ ] Auth endpoints: `/api/auth/login`, `/api/auth/register`
- [ ] RLS policies: cross-user data isolation

**Setup wymagany:** Test database w Supabase (lub local Docker)

**Outcome:** API jest stabilne i zgodne z dokumentacją

### Faza 4: Testy E2E - Happy Paths (Dni 22-26)
**Cel:** Weryfikacja kluczowych ścieżek użytkownika end-to-end

**Priorytet KRYTYCZNY:**
1. [ ] Auth flow: Rejestracja → Email confirmation → Login
2. [ ] Generation flow: Login → Paste text → Generate → Edit proposal → Save
3. [ ] Manual creation: Login → Manual form → Create → Verify in library
4. [ ] Library management: List → Edit → Delete → Pagination

**Setup:** Dev server running na localhost:4321

**Outcome:** Główne user journeys działają bez przerwy

### Faza 5: Testy E2E - Edge Cases (Dni 27-29)
**Cel:** Obsługa błędów i scenariuszy wyjątkowych

**Scenariusze:**
- [ ] Network errors i timeouty
- [ ] Rate limiting (429 errors)
- [ ] Duplicate generation error
- [ ] Validation errors (za krótki tekst, za długie pola)
- [ ] Session expiration podczas akcji
- [ ] Mobile responsiveness (Playwright mobile viewport)

**Outcome:** Aplikacja jest odporna na błędy i user-friendly

### Faza 6: CI/CD i Automatyzacja (Dni 30-32)
**Cel:** Automatyczne uruchamianie testów w pipeline

- [ ] GitHub Actions workflow dla PR checks
- [ ] Parallel test execution w CI
- [ ] Artifacts: Coverage reports, Playwright traces
- [ ] Status badge w README.md
- [ ] Notifications: Slack/Discord on test failures (opcjonalnie)

**Outcome:** Każdy PR jest automatycznie testowany przed merge

### Faza 7: Dokumentacja i Onboarding (Dni 33-34)
**Cel:** Umożliwienie zespołowi efektywnego pisania testów

- [ ] `tests/README.md` - jak pisać i uruchamiać testy
- [ ] Przykładowe testy jako templates
- [ ] Best practices i anti-patterns
- [ ] Troubleshooting guide
- [ ] Video walkthrough (opcjonalnie)

**Outcome:** Nowi deweloperzy mogą napisać test w < 30 minut

---

## 14. Następne kroki (Action Items)

### Natychmiast (przed rozpoczęciem testów):
1. **Review i akceptacja planu** - Product Owner i Tech Lead
2. **Alokacja czasu** - zaplanowanie 5-7 tygodni na implementację
3. **Setup environment** - instalacja narzędzi (Faza 0)

### Pierwsze testy do napisania (Quick Wins):
1. `generation.service.test.ts` - generateHash i checkDuplicate
2. `CharacterCounter.test.tsx` - prosty komponent UI
3. `auth-flow.spec.ts` - E2E login (smoke test)

### Ciągłe działania:
- **Code reviews** - każdy nowy kod powinien mieć testy
- **Bug tracking** - każdy bug → regression test
- **Refactoring** - testy dają pewność przy zmianach

---

**Stan dokumentu:** Zaktualizowany i gotowy do implementacji  
**Ostatnia aktualizacja:** 2026-01-25  
**Wersja:** 2.0
