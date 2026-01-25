# Specyfikacja Architektury Autentykacji i Zarządzania Użytkownikami (US-001, US-002)

## Cel

Wdrożenie kompletnego systemu rejestracji, logowania i odzyskiwania hasła w oparciu o Supabase Auth, zintegrowanego z frameworkiem Astro (SSR) i biblioteką komponentów React. System ma charakter "zamknięty" – dostęp do funkcjonalności aplikacji możliwy jest wyłącznie dla zalogowanych użytkowników. Rejestracja nie wymaga potwierdzenia e-mail, a użytkownik po poprawnej rejestracji jest automatycznie logowany i przekierowany do aplikacji.

## 1. Architektura Interfejsu Użytkownika (UI)

### Routing i Dostępność

Aplikacja działa w modelu **Secure by Default**. Domyślnie każda strona wymaga autoryzacji.

1.  **Ścieżki Publiczne (Auth):**
    - `/login` – Główny punkt wejścia dla niezalogowanych.
    - `/register` – Rejestracja.
    - `/forgot-password` – Inicjacja resetu hasła.
    - `/update-password` – Ustawienie nowego hasła (z linku email).
    - `/auth/callback` – Endpoint techniczny (wymiana tokenów).

2.  **Ścieżki Chronione (App):**
    - `/` (Root) – Działa jako router: przekierowuje na `/login` (jeśli gość) lub `/generate` (jeśli zalogowany).
    - `/generate` – Główny widok aplikacji (Tworzenie Fiszki/Generowanie).
    - `/my-flashcards` – Lista fiszek.
    - Każda inna podstrona funkcjonalna.

### Layouty

1.  **`AuthLayout.astro`**:
    - **Zastosowanie:** Strony publiczne (`/login`, `/register`, `/forgot-password`).
    - **Wygląd:** Minimalistyczny, wycentrowana karta z formularzem na jednolitym tle, w barwach zgodnych z resztą aplikacji. Brak elementów nawigacyjnych aplikacji.
    - **Cel:** Skupienie użytkownika wyłącznie na procesie logowania/rejestracji.

2.  **`Layout.astro` (Główny Layout Aplikacji)**:
    - **Zastosowanie:** Wyłącznie strony chronione (dostępny tylko po zalogowaniu).
    - **Struktura Nagłówka (Topbar):**
      - **Pozycja:** `sticky top-0`, `z-50`, `backdrop-blur`.
      - **Desktop:**
        - Lewa strona: Nazwa aplikacji.
        - Środek/Prawa strona (Linki): Generuj, Moje fiszki, Profil.
        - Akcja końcowa: Przycisk "Wyloguj".
      - **Mobile:**
        - Przycisk "Hamburger" otwierający `Sheet` (Navigation Drawer).
        - Wewnątrz Drawer'a: Pionowa lista linków + przycisk wylogowania na dole.
    - **Props:** Layout przyjmuje obiekt `user` z `Astro.locals`, aby przekazać go niżej do komponentów Reacta (w tym do obsługi wylogowania w menu).

### Komponenty React (Client-Side)

Formularze renderowane jako "islands" (`client:load`).

1.  **`LoginForm.tsx`**:
    - Obsługa logowania przez `supabase.auth.signInWithPassword`.
    - **Redirect:** Po sukcesie "twarde" przekierowanie (`window.location.href` lub `Astro.redirect` po stronie serwera akcji) na `/generate`.
2.  **`RegisterForm.tsx`**, **`ForgotPasswordForm.tsx`**, **`UpdatePasswordForm.tsx`**:
    - Zgodne ze standardem Supabase Auth.
    - **Rejestracja bez potwierdzeń e-mail:** Wyłączona w projekcie Supabase, aby automatyczne logowanie było możliwe.
    - **Redirect po rejestracji:** Po sukcesie przekierowanie na `/generate` (auto-login).
    - Walidacja Zod:
      - format e-mail,
      - minimalna długość hasła,
      - wymagane: małe i wielkie litery, cyfry oraz znaki specjalne.

## 2. Logika Backendowa i Middleware

### Middleware (`src/middleware/index.ts`)

Implementacja strategii "Whitelist" dla ścieżek publicznych.

1.  **Inicjalizacja:** Tworzenie klienta Supabase SSR z obsługą ciasteczek.
2.  **Weryfikacja Sesji:** Pobranie użytkownika (`getUser`).
3.  **Logika Ochrony (Guard):**
    - Definicja tablicy `PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/auth/callback', '/update-password']`.
    - **Scenariusz 1 (Brak sesji):** Jeśli URL _nie_ jest w `PUBLIC_ROUTES`, przekieruj na `/login`.
    - **Scenariusz 2 (Jest sesja):** Jeśli URL _jest_ w `PUBLIC_ROUTES` (np. użytkownik wchodzi na login będąc zalogowanym), przekieruj na `/generate`.
    - **Scenariusz 3 (Root `/`):**
      - Brak sesji -> Redirect `/login`.
      - Jest sesja -> Redirect `/generate`.

### Modele Danych

- `env.d.ts`: Rozszerzenie `App.Locals` o obiekt `user` (z typu `User` Supabase).

## 3. Integracja Stanu i Hydracja (Astro -> React)

Zamiast pobierać dane sesji dodatkowym zapytaniem API po załadowaniu strony, wykorzystamy mechanizm propsów Astro do zainicjowania stanu aplikacji.

### Przepływ Danych (Data Flow)

1.  **Serwer (Astro):** Middleware weryfikuje token i zapisuje użytkownika w `Astro.locals.user`.
2.  **Layout (Astro):** `Layout.astro` ma dostęp do `Astro.locals.user`.
3.  **Inicjalizacja Store (React):**
    - W `Layout.astro` osadzamy komponent Reacta, np. `<AuthProvider initialUser={Astro.locals.user} client:load>`.
    - Komponent ten (może to być Context Provider lub wrapper na Zustand) przy pierwszym renderowaniu inicjalizuje klienta Supabase i ustawia stan `user` w pamięci aplikacji React.
    - Dzięki temu React "wie" o zalogowanym użytkowniku natychmiast po załadowaniu JS, bez czekania na `network request`.

### Wylogowanie

1.  Akcja "Wyloguj" w React wywołuje `supabase.auth.signOut()`.
2.  Następuje przeładowanie strony lub przekierowanie na `/login`.
3.  Middleware usuwa ciasteczka sesyjne.

## Podsumowanie Wymaganych Zmian w Plikach

1.  **`src/middleware/index.ts`**: Implementacja logiki Whitelist (blokada wszystkiego poza auth).
2.  **`src/pages/index.astro`**: Przekierowanie serwerowe na `/generate` (zabezpieczone przez middleware, więc gość i tak trafi na login).
3.  **`src/layouts/Layout.astro`**: Aktualizacja nagłówka zgodnie z UI Plan (pełna nawigacja + wyloguj), przekazywanie `user` do Reacta.
4.  **`src/components/auth/AuthProvider.tsx`** (Nowy): Komponent React do inicjalizacji stanu na podstawie propsów z serwera.
5.  **`src/pages/auth/*`**: Utworzenie stron logowania/rejestracji z użyciem `AuthLayout`.
