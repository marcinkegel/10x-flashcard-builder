# Testy E2E - Dokumentacja

## Przegląd

Ten dokument zawiera informacje o testach E2E (End-to-End) w projekcie 10x Flashcard Builder, zaimplementowanych przy użyciu Playwright.

## Struktura testów

### Pliki testowe

```
tests/e2e/
├── pages/                          # Page Object Models
│   ├── LoginPage.ts               # POM dla strony logowania
│   ├── GeneratePage.ts            # POM dla strony generowania fiszek
│   └── FlashcardsLibraryPage.ts   # POM dla biblioteki fiszek
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

### 1. Stabilność testów
- Używaj `data-testid` zamiast selektorów CSS/XPath
- Dodawaj odpowiednie `waitFor` dla asynchronicznych operacji
- Unikaj hardcoded timeouts - używaj `waitForVisible`, `waitForURL` itp.

### 2. Page Object Model
- Każda strona ma dedykowany POM
- POM zawiera wszystkie lokatory i akcje
- Testy operują na wysokim poziomie abstrakcji

### 3. Test Data
- Użyj dedykowanej testowej bazy danych
- Izoluj dane testowe między testami
- Cleanup po testach

### 4. Assertions
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

### Problem: Flaky tests
**Rozwiązanie:**
1. Usuń `page.waitForTimeout()` - używaj dedykowanych wait
2. Dodaj retry logic dla asynchronicznych operacji
3. Sprawdź race conditions

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
