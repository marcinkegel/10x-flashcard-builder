Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI
- Sonner dla powiadomień toast
- Lucide React dla ikon
- Next-themes do obsługi motywów (light/dark mode)

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

CI/CD i Hosting:

- Github Actions do tworzenia pipeline’ów CI/CD
- Codecov do analizy i raportowania pokrycia testów
- Cloudflare Pages do hostowania aplikacji (SSR z Workers) - [https://10x-flashcard-builder.pages.dev/](https://10x-flashcard-builder.pages.dev/) 

Testy - Automatyzacja i zapewnienie jakości:

- Vitest jako główny runner dla testów jednostkowych, komponentowych i integracyjnych
- Playwright do kompleksowych testów end-to-end (E2E) w przeglądarce (Desktop Chrome)
- React Testing Library do weryfikacji interakcji w komponentach UI
- Happy-DOM jako lekkie środowisko DOM dla testów w środowisku Node.js
- MSW (Mock Service Worker) do mockowania odpowiedzi API zewnętrznych (OpenRouter)
- cross-env do obsługi zmiennych środowiskowych w skryptach

Narzędzia:

- ESLint i Prettier do zapewnienia jakości i formatowania kodu
- Husky i lint-staged do automatyzacji zadań przed commitem
