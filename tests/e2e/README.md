# Testy E2E - Dokumentacja

## Przegląd

Ten dokument zawiera informacje o testach E2E (End-to-End) w projekcie 10x Flashcard Builder, zaimplementowanych przy użyciu Playwright.

## Kluczowe zasady testowania

### 🔑 Trzy złote zasady

1. **Izolacja testów** - każdy test tworzy własne unikalne dane

   ```typescript
   const uniqueId = `TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`;
   ```

2. **Global teardown** - cleanup dzieje się RAZ po wszystkich testach
   - Usuwa tylko fiszki utworzone podczas testów (po timestampie)
   - Zachowuje pre-existing data
   - Brak race conditions między testami

3. **Nie polegaj na istniejących danych** - znajdź elementy po unikalnych identyfikatorach

   ```typescript
   // ❌ ŹLE
   const card = getFlashcard(0);

   // ✅ DOBRZE
   const card = page.getByText(uniqueId);
   ```

## Struktura testów

### Pliki testowe

```
tests/e2e/
├── pages/                          # Page Object Models
│   ├── LoginPage.ts               # POM dla strony logowania
│   ├── GeneratePage.ts            # POM dla strony generowania fiszek
│   └── FlashcardsLibraryPage.ts   # POM dla biblioteki fiszek
├── helpers/                        # Funkcje pomocnicze
│   └── teardown.ts                # Cleanup - usuwa fiszki z testów
├── global-setup.ts                # Zapisuje timestamp startu testów
├── global-teardown.ts             # Usuwa fiszki utworzone po timestampie
├── auth-login.spec.ts             # Testy przepływu logowania (10 testów)
├── flashcard-generation.spec.ts   # Testy generowania fiszek AI (8 testów)
└── flashcards-library.spec.ts     # Testy biblioteki fiszek (10 testów)
```

**Całkowita liczba testów:** 28

### Konfiguracja

Testy używają konfiguracji z pliku `.env.test`:

- `SUPABASE_URL` - URL do testowej bazy Supabase
- `SUPABASE_KEY` - Klucz publiczny Supabase
- `E2E_USER_ID` - ID użytkownika testowego
- `E2E_USERNAME` - Email użytkownika testowego
- `E2E_PASSWORD` - Hasło użytkownika testowego
- `OPENROUTER_API_KEY` - Klucz API do OpenRouter (dla testów generowania AI)

## Selektory data-testid

Wszystkie kluczowe elementy UI mają dodane selektory `data-testid` dla stabilności testów:

### LoginForm

- `login-form` - cały formularz
- `login-email-input` - pole email
- `login-password-input` - pole hasła
- `login-submit-button` - przycisk submit
- `login-error` - komunikat błędu
- `register-link` - link do rejestracji
- `forgot-password-link` - link do przypomnienia hasła

### AIGenerationForm

- `ai-generation-form` - cały formularz
- `source-text-input` - pole tekstowe źródła
- `generate-button` - przycisk generowania
- `validation-error` - błędy walidacji
- `generation-error` - błędy generowania
- `active-proposals-warning` - ostrzeżenie o aktywnych propozycjach

### ProposalItem

- `proposal-item` - kontener propozycji
- `proposal-front-text` - tekst przodu (widok)
- `proposal-back-text` - tekst tyłu (widok)
- `proposal-front-input` - input przodu (edycja)
- `proposal-back-input` - input tyłu (edycja)
- `proposal-accept-button` - przycisk akceptacji
- `proposal-reject-button` - przycisk odrzucenia
- `proposal-edit-button` - przycisk edycji
- `proposal-save-button` - przycisk zapisz
- `proposal-cancel-button` - przycisk anuluj

### FlashcardItem

- `flashcard-item` - kontener fiszki
- `flashcard-front-text` - tekst przodu
- `flashcard-back-text` - tekst tyłu
- `flashcard-edit-button` - przycisk edycji
- `flashcard-delete-button` - przycisk usuwania

### FlashcardsLibrary

- `flashcards-library` - główny kontener
- `library-title` - nagłówek "Moje fiszki"
- `flashcards-count` - licznik fiszek
- `library-loading` - stan ładowania
- `library-error` - błąd biblioteki
- `retry-button` - przycisk ponowienia

### ManualFlashcardForm

- `manual-front-input` - pole tekstowe przodu (ręczne)
- `manual-back-input` - pole tekstowe tyłu (ręczne)
- `manual-submit-button` - przycisk zapisu (ręczne)
- `manual-tab-trigger` - przełącznik na tworzenie ręczne
- `ai-tab-trigger` - przełącznik na generowanie AI

## Scenariusze testowe

### 1. Authentication - Login Flow (10 testów)

**Plik:** `auth-login.spec.ts`

- ✅ Wyświetlanie formularza logowania
- ✅ Logowanie z poprawnymi danymi
- ✅ Błąd przy niepoprawnych danych
- ✅ Walidacja pustego email
- ✅ Walidacja pustego hasła
- ✅ Stan ładowania podczas logowania
- ✅ Nawigacja do strony rejestracji
- ✅ Nawigacja do przypomnienia hasła
- ✅ Zachowanie parametru redirectTo
- ✅ Wyłączenie pól podczas logowania

### 2. AI Flashcard Generation Flow (8 testów)

**Plik:** `flashcard-generation.spec.ts`

- ✅ Wyświetlanie formularza generowania
- ✅ Walidacja zbyt krótkiego tekstu
- ✅ Walidacja zbyt długiego tekstu
- ✅ Generowanie fiszek z poprawnego tekstu
- ✅ Akceptacja propozycji
- ✅ Odrzucenie propozycji
- ✅ Edycja i zapisanie propozycji
- ✅ Nawigacja do biblioteki po zapisaniu

**Uwaga:** Testy generowania AI mogą trwać 10-35 sekund ze względu na wywołanie OpenRouter API.

### 3. Flashcards Library (10 testów)

**Plik:** `flashcards-library.spec.ts`

- ✅ Wyświetlanie biblioteki
- ✅ Wyświetlanie licznika fiszek
- ✅ Wyświetlanie tekstów fiszek
- ✅ Pokazywanie przycisków edycji/usuwania przy hover
- ✅ Otwieranie dialogu edycji
- ✅ Otwieranie dialogu usuwania
- ✅ Edycja fiszki
- ✅ Usuwanie fiszki
- ✅ Obsługa pustej biblioteki
- ✅ Nawigacja do strony generowania

## Page Object Model (POM)

Testy wykorzystują wzorzec Page Object Model dla lepszej maintainability:

### LoginPage

```typescript
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login(email, password);
await loginPage.waitForSuccessfulLogin();
```

### GeneratePage

```typescript
const generatePage = new GeneratePage(page);
await generatePage.goto();
await generatePage.fillSourceText(text);
await generatePage.clickGenerate();
await generatePage.waitForProposals();
const proposal = generatePage.getProposal(0);
await proposal.accept();
```

### FlashcardsLibraryPage

```typescript
const libraryPage = new FlashcardsLibraryPage(page);
await libraryPage.goto();
const flashcard = libraryPage.getFlashcard(0);
await flashcard.clickEdit();
```

## Uruchamianie testów

### Wymagania wstępne

1. Zainstaluj przeglądarki Playwright:

```bash
npx playwright install chromium
```

2. Upewnij się, że plik `.env.test` zawiera poprawne dane:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_public_key
E2E_USER_ID=test-user-id
E2E_USERNAME=test@example.com
E2E_PASSWORD=test_password
OPENROUTER_API_KEY=your_openrouter_key
```

**WAŻNE:** Playwright automatycznie uruchamia serwer deweloperski z konfiguracją z `.env.test`.
**NIE musisz** ręcznie uruchamiać `npm run dev` przed testami!

### Komendy

```bash
# Uruchom wszystkie testy E2E
# (Playwright automatycznie uruchomi serwer z .env.test)
npm run test:e2e

# Uruchom testy w trybie interaktywnym (UI)
npm run test:e2e:ui

# Uruchom testy z konkretnego pliku
npm run test:e2e -- tests/e2e/auth-login.spec.ts

# Uruchom testy w trybie headed (z widoczną przeglądarką)
npm run test:e2e -- --headed

# Uruchom testy w trybie debug
npm run test:e2e -- --debug

# Wygeneruj raport HTML
npm run test:e2e:report
```

### Konfiguracja Playwright

`playwright.config.ts` zawiera następującą konfigurację:

- **Browser:** Chromium (Desktop Chrome)
- **BaseURL:** `http://localhost:3000` (lub z BASE_URL env)
- **Parallel execution:** Włączone
- **Retries:** 2 na CI, 0 lokalnie
- **Timeout:** 30s domyślnie
- **Trace:** Przy pierwszym retry
- **Screenshots:** Tylko przy błędzie
- **Video:** Zachowywane przy błędzie
- **WebServer:** Automatycznie uruchamia `npm run dev` z zmiennymi z `.env.test`

**WAŻNE:** Playwright automatycznie uruchamia serwer deweloperski z konfiguracją z `.env.test`.
Nie musisz ręcznie uruchamiać `npm run dev` - Playwright zrobi to za Ciebie z prawidłową konfiguracją!

## Best Practices

### 1. Test Teardown Strategy

**WAŻNE:** Wszystkie testy E2E używają jednego wspólnego konta testowego użytkownika.

#### Global Setup & Teardown (aktualne podejście)

Aby uniknąć konfliktów podczas równoległego wykonywania testów i zachować istniejące dane:

1. **Global setup** zapisuje timestamp rozpoczęcia testów
2. **Testy działają równolegle** i tworzą unikalne dane
3. **Global teardown** usuwa TYLKO fiszki utworzone podczas testów (po timestampie)

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: "./tests/e2e/global-setup.ts", // Zapisuje timestamp
  globalTeardown: "./tests/e2e/global-teardown.ts", // Usuwa tylko nowe fiszki
  fullyParallel: true, // Testy działają równolegle bezpiecznie
});
```

#### Jak to działa?

1. **Global Setup** (przed testami):

   ```typescript
   // Zapisuje timestamp startu: 2026-02-01T15:30:00.000Z
   ```

2. **Testy** (tworzą fiszki):

   ```typescript
   // Test A tworzy fiszkę o 15:31:00
   // Test B tworzy fiszkę o 15:32:00
   // Test C tworzy fiszkę o 15:33:00
   ```

3. **Global Teardown** (po testach):
   ```typescript
   // Usuwa TYLKO fiszki z created_at >= 2026-02-01T15:30:00.000Z
   // ✅ Zachowuje fiszki sprzed testów
   ```

#### Dlaczego to podejście?

**Problem z Per-Test Teardown (ŹLE):**

- ❌ Test A usuwa wszystkie fiszki w `afterAll`
- ❌ Test B (działający równolegle) miał fiszki usunięte przez Test A
- ❌ Test B pada, bo jego dane zniknęły

**Rozwiązanie z Global Teardown (DOBRZE):**

- ✅ Wszystkie testy działają równolegle bez wzajemnych zakłóceń
- ✅ Każdy test tworzy unikatowo zidentyfikowane dane
- ✅ Cleanup następuje raz na samym końcu
- ✅ Brak race conditions
- ✅ **Zachowuje fiszki istniejące przed testami**

#### Konfiguracja Teardown

Włącz/wyłącz teardown przez zmienną środowiskową:

```bash
# Włącz teardown (czyści dane po testach)
E2E_TEARDOWN=true npm run test:e2e

# Wyłącz teardown (zostawia dane do inspekcji)
E2E_TEARDOWN=false npm run test:e2e
```

### 2. Stabilność testów i izolacja danych

#### Używaj unikalnych identyfikatorów

**Dla testów modyfikujących dane (edit, delete):**

- ✅ Twórz własną unikalną fiszkę przed testem
- ✅ Znajdź fiszkę po unikalnym identyfikatorze
- ❌ NIE polegaj na istniejących danych lub indeksach

**Przykład - test delete flashcard:**

```typescript
test("should delete flashcard successfully", async ({ page }) => {
  // 1. Utwórz unikalną fiszkę
  const uniqueFrontText = `DELETE_TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  await flashcardsPage.createManualFlashcard(uniqueFrontText, "back text");

  // 2. Znajdź fiszkę po unikalnym tekście
  const uniqueFlashcard = page
    .getByTestId("flashcard-item")
    .filter({ has: page.getByTestId("flashcard-front-text").filter({ hasText: uniqueFrontText }) });

  // 3. Wykonaj operację
  await uniqueFlashcard.getByTestId("flashcard-delete-button").click();

  // 4. Weryfikuj że TWOJA fiszka została usunięta
  await expect(uniqueFlashcard).toHaveCount(0);
});
```

**Dlaczego to ważne?**

- ✅ Test nie zależy od kolejności sortowania
- ✅ Test działa niezależnie od innych testów (parallel safe)
- ✅ Test nie wpływa na inne testy
- ✅ Test jest powtarzalny i przewidywalny

#### Selektory i czekanie

- Używaj `data-testid` zamiast selektorów CSS/XPath
- Dodawaj odpowiednie `waitFor` dla asynchronicznych operacji
- Unikaj hardcoded timeouts - używaj `waitForVisible`, `waitForURL` itp.
- Czekaj na `networkidle` po operacjach API

### 3. Page Object Model

- Użyj dedykowanej testowej bazy danych
- Izoluj dane testowe między testami
- Cleanup po testach

### 3. Page Object Model

- Każda strona ma dedykowany POM
- POM zawiera wszystkie lokatory i akcje
- Testy operują na wysokim poziomie abstrakcji

### 4. Test Data

- Użyj dedykowanej testowej bazy danych
- **Testy tworzą unikatowe dane** używając timestampów i losowych ID
- **Global teardown** czyści wszystko RAZ po zakończeniu wszystkich testów

### 4. Test Data

- Użyj dedykowanej testowej bazy danych
- **Testy tworzą unikatowe dane** używając timestampów i losowych ID
- **Testy modyfikujące dane (edit, delete) tworzą własne fiszki** zamiast używać istniejących
- **Global teardown** czyści wszystko RAZ po zakończeniu wszystkich testów

**Przykłady unikalnych identyfikatorów:**

```typescript
// Test delete
const uniqueId = `DELETE_TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`;

// Test edit
const uniqueId = `EDIT_TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`;

// Test generation
const uniqueSuffix = `\n\n--- Test run: ${timestamp}-${random} ---\n`;
```

### 5. Assertions

- Używaj Playwright assertions (`expect` from @playwright/test)
- Weryfikuj stan UI, a nie tylko obecność elementów
- Testuj happy path i edge cases

## Rozwiązywanie problemów

### Problem: Testy timeout

**Rozwiązanie:** Sprawdź czy serwer deweloperski działa i zwiększ timeout w konfiguracji.

### Problem: Element not found

**Rozwiązanie:**

1. Sprawdź czy `data-testid` jest poprawnie dodany
2. Dodaj `await element.waitFor()` przed interakcją
3. Sprawdź czy element nie jest w Shadow DOM

### Problem: Flaky tests (niestabilne testy)

**Objawy:**

- Test pada losowo
- Działa lokalnie, ale pada na CI
- "Element not found" lub timeout errors

**Najczęstsze przyczyny i rozwiązania:**

1. **Test zależy od istniejących danych lub kolejności**

   ```typescript
   // ❌ ŹLE - zależy od indeksu
   const firstFlashcard = libraryPage.getFlashcard(0);
   await firstFlashcard.clickEdit();

   // ✅ DOBRZE - tworzy własne dane
   const uniqueText = `TEST_${Date.now()}`;
   await createFlashcard(uniqueText);
   const myFlashcard = page.getByText(uniqueText);
   await myFlashcard.clickEdit();
   ```

2. **Zbyt krótkie timeouty**

   ```typescript
   // ❌ ŹLE
   await page.waitForTimeout(100);

   // ✅ DOBRZE
   await expect(element).toBeVisible({ timeout: 5000 });
   await page.waitForLoadState("networkidle");
   ```

3. **Race conditions z innymi testami**
   - Używaj unikalnych identyfikatorów dla danych testowych
   - Nie usuwaj danych w `afterEach` - użyj global teardown

### Problem: Przeglądarki nie zainstalowane

**Rozwiązanie:**

```bash
npx playwright install chromium
```

## Raportowanie

Po zakończeniu testów:

1. **Console output** - podstawowe informacje o przejściu/niepowodzeniu
2. **HTML Report** - szczegółowy raport z screenshotami i video
   ```bash
   npm run test:e2e:report
   ```
3. **Trace Viewer** - debug failed tests
   ```bash
   npx playwright show-trace trace.zip
   ```

## Przyszły rozwój: Continuous Integration

Obecnie testy E2E **nie są** częścią automatycznego pipeline'u CI/CD ze względu na wymagania dotyczące konfiguracji sekretów i dostępu do API w chmurze.

W przyszłości planujemy:

- Automatyczne uruchomienie przy PR i push do main (po skonfigurowaniu GitHub Actions Secrets)
- Wyłączenie parallel execution na CI dla większej stabilności
- Konfigurację 2 retries dla failed tests
- Publikację Artifacts (screenshots, videos, traces) dostępnych po zakończeniu testu na CI

## Dalszy rozwój

### Planowane usprawnienia

- [ ] Dodać testy dla sesji nauki (gdy funkcja będzie zaimplementowana)
- [ ] Dodać visual regression testing
- [ ] Implementować test fixtures dla wspólnych setup/teardown
- [ ] Dodać performance testing z Lighthouse
- [ ] Rozszerzyć coverage o mobile viewports

### Możliwe rozszerzenia

- API testing z Playwright
- Component testing dla izolowanych komponentów
- Accessibility testing z axe-core
- Cross-browser testing (Firefox, WebKit)

## Kontakt i wsparcie

Przy problemach z testami:

1. Sprawdź dokumentację Playwright: https://playwright.dev
2. Przejrzyj test logs i trace files
3. Skontaktuj się z zespołem QA

---

**Utworzono:** 2026-01-31  
**Wersja:** 1.0  
**Autor:** AI Assistant  
**Status:** ✅ Kompletne i gotowe do użycia
