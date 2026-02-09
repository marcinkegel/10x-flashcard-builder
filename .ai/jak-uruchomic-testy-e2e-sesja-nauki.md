# Jak uruchomić testy E2E sesji nauki

## Szybki start

### 1. Upewnij się, że masz skonfigurowane środowisko

Sprawdź plik `.env.test`:
```env
E2E_USERNAME=twoj-email-testowy@example.com
E2E_PASSWORD=twoje-haslo-testowe
SUPABASE_URL=twoj-supabase-url
SUPABASE_KEY=twoj-supabase-key
BASE_URL=http://localhost:3000
```

### 2. Zainstaluj zależności (jeśli jeszcze nie zrobiłeś)

```bash
npm install
npx playwright install chromium
```

### 3. Uruchom testy

#### Wszystkie testy E2E (włącznie z testami sesji nauki)
```bash
npm run test:e2e
```

#### Tylko testy sesji nauki
```bash
npx playwright test learning-session
```

## Różne tryby uruchamiania

### Tryb interaktywny (UI mode) - POLECANY dla debugowania
```bash
npx playwright test learning-session --ui
```

**Zalety:**
- Widzisz wszystkie testy w interfejsie graficznym
- Możesz uruchomić pojedyncze testy
- Widzisz na żywo co się dzieje w przeglądarce
- Łatwy debug

### Tryb headed (widoczna przeglądarka)
```bash
npx playwright test learning-session --headed
```

**Kiedy używać:**
- Gdy chcesz zobaczyć co dzieje się w przeglądarce
- Przydatne do debugowania konkretnego testu

### Tryb debug (krok po kroku)
```bash
npx playwright test learning-session --debug
```

**Kiedy używać:**
- Gdy test nie przechodzi i chcesz zobaczyć dokładnie gdzie
- Możesz przejść test krok po kroku

### Pojedynczy test
```bash
npx playwright test -g "should start session and load cards correctly"
```

Zastąp tekst w cudzysłowie nazwą testu, który chcesz uruchomić.

## Przydatne komendy

### Zobacz raport z ostatniego uruchomienia
```bash
npx playwright show-report
```

### Uruchom testy na konkretnym viewport (mobile)
```bash
npx playwright test learning-session --project=chromium
```

### Uruchom testy i zatrzymaj się na pierwszym błędzie
```bash
npx playwright test learning-session -x
```

### Uruchom testy z większą ilością informacji
```bash
npx playwright test learning-session --reporter=list
```

## Interpretacja wyników

### ✅ Test przeszedł pomyślnie
```
✓ should start session and load cards correctly (2s)
```

### ❌ Test nie przeszedł
```
✗ should start session and load cards correctly (2s)
  Error: Timeout 5000ms exceeded
```

**Co zrobić:**
1. Uruchom test w trybie `--headed` aby zobaczyć co się dzieje
2. Sprawdź screenshots w `test-results/`
3. Uruchom w trybie `--debug` aby przejść test krok po kroku

### ⊘ Test został pominięty
```
⊘ should start session and load cards correctly
```

**Przyczyny:**
- Test używa `test.skip()` gdy warunki nie są spełnione (np. pusta biblioteka)
- To normalne zachowanie - niektóre testy pomijają się gdy dane nie są dostępne

## Debugowanie testów

### 1. Sprawdź logi
Testy wyświetlają informacje o tym co robią. Szukaj:
```
await sessionPage.goto();
await sessionPage.waitForLoadingComplete();
```

### 2. Zobacz screenshots
Po nieudanym teście, sprawdź folder `test-results/`:
```
test-results/
  learning-session-should-start-session/
    test-failed-1.png
```

### 3. Zobacz video
Video jest nagrywane przy błędach:
```
test-results/
  learning-session-should-start-session/
    video.webm
```

### 4. Zobacz trace
Trace zawiera pełną historię testu:
```bash
npx playwright show-trace test-results/.../trace.zip
```

## Często spotykane problemy

### Problem: "Timeout waiting for..."
**Rozwiązanie:**
- Serwer dev może być wolny, poczekaj chwilę
- Sprawdź czy aplikacja działa lokalnie na `http://localhost:3000`
- Zwiększ timeout w teście

### Problem: "Login failed"
**Rozwiązanie:**
- Sprawdź czy użytkownik z `.env.test` istnieje w bazie danych
- Sprawdź czy hasło jest poprawne
- Sprawdź czy Supabase URL i KEY są poprawne

### Problem: "Element not found"
**Rozwiązanie:**
- Uruchom test z `--headed` aby zobaczyć co jest na stronie
- Sprawdź czy element ma odpowiedni `data-testid` lub `role`
- Może być problem z timing - dodaj `waitFor`

### Problem: Test przechodzi lokalnie ale nie na CI
**Rozwiązanie:**
- Sprawdź czy wszystkie zmienne środowiskowe są ustawione na CI
- Sprawdź czy baza danych testowa jest dostępna z CI
- Może być problem z timing - CI jest wolniejsze

## Struktura testów sesji nauki

```
tests/e2e/learning-session.spec.ts
├── Learning Session - UI and Loading (4 testy)
│   ├── T-UI-01: Start sesji i ładowanie
│   ├── T-UI-02: Pusty stan biblioteki
│   ├── T-UI-03: Odwracanie karty
│   └── Wyświetlanie szkieletu ładowania
│
├── Learning Session - Logic and Queueing (4 testy)
│   ├── T-LOG-01: Akcja "Znam"
│   ├── T-LOG-02: Akcja "Powtórz"
│   ├── T-LOG-03: Zakończenie sesji ze statystykami
│   └── Ukończenie sesji bez powtórek
│
├── Learning Session - Keyboard Shortcuts (3 testy)
│   ├── T-KEY-01: Pełna obsługa klawiaturą
│   ├── Ograniczenie klawiszy do odwróconej karty
│   └── Wyświetlanie podpowiedzi klawiszowych
│
├── Learning Session - Mobile Responsiveness (2 testy)
│   ├── T-MOB-01: Poprawne wyświetlanie na mobile
│   └── Obsługa długiej treści z przewijaniem
│
├── Learning Session - API Integration (2 testy)
│   ├── T-API-01: Losowe fiszki przy każdym starcie
│   └── Obsługa błędów API
│
├── Learning Session - Navigation (4 testy)
│   ├── Nawigacja z navbar
│   ├── Powrót do biblioteki ze stanu pustego
│   ├── Powrót do biblioteki z podsumowania
│   └── Nowa sesja z podsumowania
│
└── Learning Session - Progress Tracking (2 testy)
    ├── Aktualizacja paska postępu
    └── Aktualizacja licznika kart
```

## Przykładowe użycie

### Scenariusz 1: Sprawdzenie czy wszystko działa
```bash
# Uruchom wszystkie testy sesji nauki
npx playwright test learning-session

# Zobacz raport
npx playwright show-report
```

### Scenariusz 2: Debugowanie konkretnego testu
```bash
# Uruchom w trybie interaktywnym
npx playwright test learning-session --ui

# Lub z widoczną przeglądarką
npx playwright test -g "should flip card" --headed
```

### Scenariusz 3: Przed commitem
```bash
# Szybkie sprawdzenie
npx playwright test learning-session --reporter=list

# Jeśli coś nie działa
npx playwright test learning-session --headed --reporter=line
```

### Scenariusz 4: Testowanie na mobile
```bash
# Testy mobile responsiveness
npx playwright test -g "T-MOB" --headed
```

## Wskazówki

1. **Zawsze uruchamiaj testy przed commitem** - upewnij się, że nic nie zepsułeś
2. **Używaj trybu UI podczas developmentu** - najszybszy sposób na debug
3. **Sprawdzaj screenshots i video** - często pokazują więcej niż logi
4. **Nie ignoruj pominiętych testów** - mogą wskazywać na problem z danymi testowymi
5. **Testy są niezależne** - każdy test tworzy swoje dane, nie przeszkadzają sobie nawzajem

## Więcej informacji

- [Plan testowy](.ai/learning-session-test-plan.md)
- [Podsumowanie testów E2E](.ai/learning-session-e2e-tests-summary.md)
- [Dokumentacja Playwright](https://playwright.dev/)
- [Reguły testowania E2E](.cursor/rules/testing-e2e-playwright.mdc)
