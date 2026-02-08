# Cloudflare Pages Deployment Guide

Ten dokument opisuje kroki niezbędne do skonfigurowania automatycznego wdrażania aplikacji 10x-flashcard-builder na Cloudflare Pages.

## Wymagania wstępne

- Konto Cloudflare z dostępem do Cloudflare Pages
- Konto GitHub z właścicielem lub administratorem repozytorium
- Dostęp do Cloudflare API Token
- Istniejąca baza danych Supabase
- Klucz API OpenRouter

## Krok 1: Utwórz projekt Cloudflare Pages

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do **Workers & Pages** > **Overview**
3. Kliknij **Create Application** > **Pages** > **Connect to Git**
4. **WAŻNE**: Podczas konfiguracji:
   - **Framework preset**: None
   - **Build command**: Pozostaw puste (build będzie wykonywany przez GitHub Actions)
   - **Build output directory**: `dist`
   - Kliknij **Save and Deploy**

## Krok 2: Uzyskaj Cloudflare API Token i Account ID

### Cloudflare Account ID:
1. W Cloudflare Dashboard przejdź do **Workers & Pages** > **Overview**
2. Po prawej stronie znajdziesz **Account ID** - skopiuj go

### Cloudflare API Token:
1. Przejdź do [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Kliknij **Create Token**
3. Wybierz template **Edit Cloudflare Workers**
4. Zmodyfikuj uprawnienia:
   - **Account** > **Cloudflare Pages** > **Edit**
5. Kliknij **Continue to summary** > **Create Token**
6. Skopiuj token (pojawi się tylko raz!)

## Krok 3: Utwórz KV Namespace dla sesji

1. W Cloudflare Dashboard przejdź do **Workers & Pages** > **KV**
2. Kliknij **Create a namespace**
3. Nazwa: `flashcard-builder-sessions`
4. Kliknij **Add**
5. Skopiuj **ID** namespace (będzie potrzebne w kroku 5)

## Krok 4: Skonfiguruj GitHub Secrets i Variables

### GitHub Secrets (Settings > Secrets and variables > Actions > New repository secret):

1. `CLOUDFLARE_API_TOKEN` - Token z Kroku 2
2. `CLOUDFLARE_ACCOUNT_ID` - Account ID z Kroku 2
3. `SUPABASE_KEY` - Twój Supabase anon key
4. `SUPABASE_SERVICE_ROLE_KEY` - Twój Supabase service role key
5. `OPENROUTER_API_KEY` - Twój OpenRouter API key
6. `CODECOV_TOKEN` - Token Codecov (opcjonalny, jeśli używasz Codecov)

### GitHub Variables (Settings > Secrets and variables > Actions > Variables > New repository variable):

1. `CLOUDFLARE_PROJECT_NAME` - Nazwa projektu z Kroku 1 (np. `10x-flashcard-builder`)
2. `SUPABASE_URL` - URL Twojej instancji Supabase (np. `https://xxxxx.supabase.co`)

## Krok 5: Skonfiguruj zmienne środowiskowe w Cloudflare Pages

1. W Cloudflare Dashboard przejdź do **Workers & Pages**
2. Wybierz swój projekt
3. Przejdź do **Settings** > **Environment variables**
4. W sekcji **Production** dodaj następujące zmienne:

| Nazwa zmiennej | Wartość |
|----------------|---------|
| `SUPABASE_URL` | URL Twojej instancji Supabase |
| `SUPABASE_KEY` | Twój Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Twój Supabase service role key |
| `OPENROUTER_API_KEY` | Twój OpenRouter API key |

5. Kliknij **Save**

## Krok 6: Skonfiguruj KV Binding i Runtime Compatibility

### KV Namespace dla sesji

1. W projekcie Cloudflare Pages przejdź do **Settings** > **Functions**
2. W sekcji **KV namespace bindings** kliknij **Add binding**
3. Wypełnij:
   - **Variable name**: `SESSION`
   - **KV namespace**: Wybierz namespace utworzony w Kroku 3
4. Kliknij **Save**

### Runtime Compatibility Flags

W projekcie Cloudflare Pages przejdź do **Settings** > **Compatibility Flags**:

1. **Compatibility Date**: Ustaw na najnowszą dostępną datę (np. `2024-11-21` lub nowszą)
2. **Compatibility Flags**: Dodaj `nodejs_compat`
   - Ta flaga włącza kompatybilność z Node.js API
   - Umożliwia automatyczne populowanie `process.env` ze zmiennych Cloudflare
   - Zapewnia lepszą kompatybilność z npm packages

**Uwaga**: Flaga `nodejs_compat` jest już skonfigurowana w `wrangler.toml`, ale dobrą praktyką jest również ustawienie jej w Cloudflare Dashboard dla spójności.

## Krok 7: Weryfikacja konfiguracji wrangler.toml

Plik `wrangler.toml` w głównym katalogu projektu powinien zawierać:

```toml
name = "10x-flashcard-builder"
compatibility_date = "2024-11-21"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "./dist"

# Environment variables and KV bindings are configured in Cloudflare Dashboard
```

**Uwaga**: KV namespace bindings są konfigurowane w Cloudflare Dashboard (Krok 6), nie w `wrangler.toml`.

## Krok 8: Pierwsza deployment

1. Upewnij się, że wszystkie zmiany są zatwierdzone
2. Push zmian do gałęzi `master`:

```bash
git add .
git commit -m "feat: configure Cloudflare Pages deployment"
git push origin master
```

3. Workflow GitHub Actions automatycznie:
   - Uruchomi testy
   - Zbuduje aplikację
   - Wdroży na Cloudflare Pages

4. Monitoruj proces w zakładce **Actions** w repozytorium GitHub

## Krok 9: Weryfikacja deploymentu

1. Po zakończeniu workflow, przejdź do Cloudflare Dashboard
2. Otwórz swój projekt w **Workers & Pages**
3. Kliknij na najnowszy deployment
4. Znajdź URL swojej aplikacji (np. `https://10x-flashcard-builder.pages.dev`)
5. Otwórz URL w przeglądarce i zweryfikuj, że aplikacja działa

## Konfiguracja domeny niestandardowej (opcjonalnie)

1. W projekcie Cloudflare Pages przejdź do **Custom domains**
2. Kliknij **Set up a custom domain**
3. Wprowadź swoją domenę (np. `flashcards.example.com`)
4. Postępuj zgodnie z instrukcjami, aby zaktualizować rekordy DNS

## Troubleshooting

### Build się nie powiódł

- Sprawdź logi w GitHub Actions
- Upewnij się, że wszystkie zmienne środowiskowe są poprawnie skonfigurowane

### Aplikacja nie działa po wdrożeniu

- Sprawdź logi w Cloudflare Dashboard (Workers & Pages > Twój projekt > Logs)
- Upewnij się, że KV binding jest poprawnie skonfigurowany
- Sprawdź czy wszystkie zmienne środowiskowe są ustawione w Cloudflare Pages

### Problemy z sesjami

- Sprawdź czy KV namespace jest poprawnie podpięty
- Sprawdź binding `SESSION` w ustawieniach Functions

### Błąd "MessageChannel is not defined"

Ten problem został rozwiązany w projekcie poprzez:
1. Dodanie polyfilla dla React 19 (`src/polyfills.ts`)
2. Automatyczne wstrzykiwanie polyfilla na początku worker bundle za pomocą Vite plugin (`polyfill-plugin.mjs`)
3. Polyfill jest teraz ładowany automatycznie przed jakimkolwiek innym kodem

Jeśli nadal widzisz ten błąd:
- Upewnij się, że plik `polyfill-plugin.mjs` istnieje w głównym katalogu projektu
- Sprawdź czy plugin jest zaimportowany i użyty w `astro.config.mjs`
- Przebuduj projekt: `npm run build`
- Sprawdź czy polyfill pojawia się na początku pliku `dist/_worker.js/index.js`

## Dodatkowe informacje

- Każdy push do gałęzi `master` będzie automatycznie wdrażał nową wersję
- Pull requesty nie wyzwalają deploymentu (tylko testy)
- Cloudflare Pages automatycznie obsługuje SSL/TLS
- Aplikacja używa Cloudflare Workers do Server-Side Rendering (SSR)

## Przydatne linki

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
