# Schema Bazy Danych PostgreSQL - Flashcard Builder MVP

## 1. Tabele z Kolumnami, Typami Danych i Ograniczeniami

### 1.1. users (auth.users)

Tabela zarządzana przez Supabase Auth. Nie wymaga ręcznego tworzenia.

**Kluczowe pola wykorzystywane w relacjach:**
- `id` (UUID) - identyfikator użytkownika
- `email` (TEXT) - adres e-mail
- `created_at` (TIMESTAMPTZ) - data utworzenia konta

---

### 1.2. flashcards

Główna tabela przechowująca fiszki edukacyjne użytkownika.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator fiszki |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Właściciel fiszki |
| `generation_id` | UUID | REFERENCES generations(id) ON DELETE SET NULL | Opcjonalne powiązanie z sesją AI |
| `source` | flashcard_source_enum | NOT NULL | Źródło pochodzenia fiszki |
| `front` | VARCHAR(200) | NOT NULL, CHECK (char_length(front) > 0 AND char_length(front) <= 200) | Przód fiszki (pytanie) |
| `back` | VARCHAR(500) | NOT NULL, CHECK (char_length(back) > 0 AND char_length(back) <= 500) | Tył fiszki (odpowiedź) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej modyfikacji |

**Typ wyliczeniowy (ENUM):**

```sql
CREATE TYPE flashcard_source_enum AS ENUM (
  'ai-full',      -- zaakceptowana bez edycji
  'ai-edited',    -- zaakceptowana z edycją
  'manual'        -- utworzona ręcznie przez użytkownika
);
```

**Uwagi:**
- Pole `generation_id` jest opcjonalne (NULL dla fiszek manualnych)
- ON DELETE SET NULL dla `generation_id` zachowuje fiszkę nawet po usunięciu sesji generowania
- ON DELETE CASCADE dla `user_id` zapewnia zgodność z RODO

---

### 1.3. generations

Tabela przechowująca sesje generowania fiszek przez AI wraz ze statystykami.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator sesji |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Właściciel sesji |
| `source_text_hash` | VARCHAR(64) | NOT NULL | Hash SHA-256 tekstu źródłowego |
| `source_text_length` | INTEGER | NOT NULL, CHECK (source_text_length >= 1000 AND source_text_length <= 10000) | Długość tekstu źródłowego w znakach |
| `model_name` | VARCHAR(100) | NOT NULL | Nazwa modelu LLM użytego do generowania |
| `generated_count` | INTEGER | NOT NULL, DEFAULT 0, CHECK (generated_count >= 0) | Liczba wygenerowanych propozycji |
| `accepted_full_count` | INTEGER | NOT NULL, DEFAULT 0, CHECK (accepted_full_count >= 0) | Liczba zaakceptowanych bez edycji |
| `accepted_edited_count` | INTEGER | NOT NULL, DEFAULT 0, CHECK (accepted_edited_count >= 0) | Liczba zaakceptowanych z edycją |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia sesji |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Uwagi:**
- Hash SHA-256 to zawsze 64 znaki w formacie szesnastkowym
- Liczniki są aktualizowane przy akceptacji/odrzuceniu propozycji
- `accepted_full_count + accepted_edited_count` = liczba fiszek powiązanych z tą sesją

---

### 1.4. generation_error_logs

Tabela audytowa przechowująca błędy podczas komunikacji z API LLM.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator błędu |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Użytkownik, który doświadczył błędu |
| `source_text_length` | INTEGER | NOT NULL, CHECK (source_text_length > 0) | Długość tekstu, który próbowano przetworzyć |
| `model_name` | VARCHAR(100) | NOT NULL | Nazwa modelu LLM, który zwrócił błąd |
| `error_code` | VARCHAR(50) | NOT NULL | Kod błędu (np. timeout, 500, rate_limit) |
| `error_message` | TEXT | NOT NULL | Pełna treść komunikatu o błędzie |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data i czas wystąpienia błędu |

**Uwagi:**
- Nie ma pola `updated_at` - logi błędów są niemutowalne
- Tabela służy do analizy i debugowania problemów z API
- Umożliwia monitoring skuteczności różnych modeli LLM

---

## 2. Relacje Między Tabelami

### 2.1. Diagram Relacji

```
auth.users (1) ─────< (N) flashcards
    │
    │ (1)
    │
    └──────< (N) generations
    │
    │ (1)
    │
    └──────< (N) generation_error_logs

generations (1) ─────< (N) flashcards [OPTIONAL]
```

### 2.2. Szczegółowy Opis Relacji

#### users → flashcards (1:N)
- **Kardynalność**: Jeden użytkownik może posiadać wiele fiszek
- **Klucz obcy**: `flashcards.user_id` → `auth.users.id`
- **Usuwanie**: `ON DELETE CASCADE` (usunięcie użytkownika usuwa wszystkie jego fiszki)

#### users → generations (1:N)
- **Kardynalność**: Jeden użytkownik może mieć wiele sesji generowania
- **Klucz obcy**: `generations.user_id` → `auth.users.id`
- **Usuwanie**: `ON DELETE CASCADE` (usunięcie użytkownika usuwa wszystkie jego sesje)

#### users → generation_error_logs (1:N)
- **Kardynalność**: Jeden użytkownik może mieć wiele błędów
- **Klucz obcy**: `generation_error_logs.user_id` → `auth.users.id`
- **Usuwanie**: `ON DELETE CASCADE` (usunięcie użytkownika usuwa wszystkie jego logi błędów)

#### generations → flashcards (1:N, OPTIONAL)
- **Kardynalność**: Jedna sesja generowania może stworzyć wiele fiszek
- **Klucz obcy**: `flashcards.generation_id` → `generations.id`
- **Usuwanie**: `ON DELETE SET NULL` (usunięcie sesji zachowuje fiszki, ale zeruje powiązanie)
- **Uwaga**: Fiszki manualne mają `generation_id = NULL`

---

## 3. Indeksy

### 3.1. Indeksy dla Wydajności Zapytań

```sql
-- Indeks na user_id w tabeli flashcards (najczęściej filtrowane pole)
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);

-- Indeks na generation_id w tabeli flashcards (dla JOIN'ów ze statystykami)
CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);

-- Indeks na user_id w tabeli generations
CREATE INDEX idx_generations_user_id ON generations(user_id);

-- Indeks na user_id w tabeli generation_error_logs
CREATE INDEX idx_generation_error_logs_user_id ON generation_error_logs(user_id);

-- Indeks na created_at w generation_error_logs (dla analizy czasowej błędów)
CREATE INDEX idx_generation_error_logs_created_at ON generation_error_logs(created_at DESC);
```

### 3.2. Indeks Unikalny dla Zapobiegania Duplikatom

```sql
-- Uniemożliwia użytkownikowi wielokrotne generowanie fiszek z tego samego tekstu
CREATE UNIQUE INDEX idx_generations_user_text_unique 
ON generations(user_id, source_text_hash);
```

**Uwaga**: Ten indeks pozwala różnym użytkownikom używać tego samego tekstu źródłowego, ale blokuje duplikaty dla pojedynczego użytkownika.

---

## 4. Zasady Row Level Security (RLS)

### 4.1. Włączenie RLS dla Wszystkich Tabel

```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;
```

### 4.2. Polityki dla Tabeli flashcards

```sql
-- Użytkownik może odczytać tylko swoje fiszki
CREATE POLICY "Users can view own flashcards"
ON flashcards FOR SELECT
USING (auth.uid() = user_id);

-- Użytkownik może tworzyć fiszki tylko dla siebie
CREATE POLICY "Users can create own flashcards"
ON flashcards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Użytkownik może aktualizować tylko swoje fiszki
CREATE POLICY "Users can update own flashcards"
ON flashcards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Użytkownik może usuwać tylko swoje fiszki
CREATE POLICY "Users can delete own flashcards"
ON flashcards FOR DELETE
USING (auth.uid() = user_id);
```

### 4.3. Polityki dla Tabeli generations

```sql
-- Użytkownik może odczytać tylko swoje sesje
CREATE POLICY "Users can view own generations"
ON generations FOR SELECT
USING (auth.uid() = user_id);

-- Użytkownik może tworzyć sesje tylko dla siebie
CREATE POLICY "Users can create own generations"
ON generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Użytkownik może aktualizować tylko swoje sesje (liczniki)
CREATE POLICY "Users can update own generations"
ON generations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Użytkownik może usuwać tylko swoje sesje
CREATE POLICY "Users can delete own generations"
ON generations FOR DELETE
USING (auth.uid() = user_id);
```

### 4.4. Polityki dla Tabeli generation_error_logs

```sql
-- Użytkownik może odczytać tylko swoje logi błędów
CREATE POLICY "Users can view own error logs"
ON generation_error_logs FOR SELECT
USING (auth.uid() = user_id);

-- Użytkownik może tworzyć logi błędów tylko dla siebie
CREATE POLICY "Users can create own error logs"
ON generation_error_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Brak polityk UPDATE i DELETE - logi są niemutowalne
```

---

## 5. Triggery i Funkcje

### 5.1. Automatyczna Aktualizacja Pola updated_at

```sql
-- Funkcja aktualizująca pole updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla tabeli flashcards
CREATE TRIGGER update_flashcards_updated_at
BEFORE UPDATE ON flashcards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger dla tabeli generations
CREATE TRIGGER update_generations_updated_at
BEFORE UPDATE ON generations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## 6. Dodatkowe Uwagi i Decyzje Projektowe

### 6.1. Bezpieczeństwo i Zgodność z RODO

- **Row Level Security (RLS)** zapewnia izolację danych na poziomie bazy danych
- **ON DELETE CASCADE** dla `user_id` we wszystkich tabelach gwarantuje pełne usunięcie danych użytkownika przy kasowaniu konta
- **UUID zamiast SERIAL** uniemożliwia wnioskowanie o liczbie użytkowników lub fiszek w systemie

### 6.2. Wydajność i Skalowalność

- **Indeksy na kluczach obcych** (`user_id`, `generation_id`) przyspieszają operacje JOIN i filtrowanie
- **Unikalny indeks na hashach** zapobiega kosztownym duplikatom sesji generowania
- **VARCHAR z limitami** zamiast TEXT zapewnia przewidywalność rozmiaru danych
- **Ograniczenia CHECK** wymuszają integralność danych na poziomie bazy

### 6.3. Analityka i Monitoring

- **Liczniki w tabeli generations** pozwalają na obliczanie wskaźników:
  - Acceptance Rate: `(accepted_full_count + accepted_edited_count) / generated_count`
  - Edit Rate: `accepted_edited_count / (accepted_full_count + accepted_edited_count)`
  - AI Adoption: `COUNT(*) WHERE source != 'manual' / COUNT(*)`

- **Tabela generation_error_logs** umożliwia:
  - Analiza niezawodności różnych modeli LLM
  - Monitoring trendów błędów w czasie
  - Debugowanie problemów zgłaszanych przez użytkowników

### 6.4. Elastyczność dla Przyszłych Rozszerzeń

- **Opcjonalny generation_id** pozwala na mieszanie fiszek manualnych i AI
- **ON DELETE SET NULL** dla generacji zachowuje fiszki nawet po czyszczeniu starych sesji
- **ENUM dla source** można rozszerzyć o nowe wartości (np. `imported`, `shared`)
- Struktura gotowa na dodanie pól algorytmu spaced repetition w przyszłości

### 6.5. Nierozstrzygnięte Kwestie (do Implementacji w Kolejnych Iteracjach)

1. **Pola Algorytmu Spaced Repetition**
   - Należy dodać do tabeli `flashcards`: `interval` (INTEGER), `easiness_factor` (DECIMAL), `next_review_date` (DATE), `review_count` (INTEGER)
   - W dokumentacji algorytmu zewnętrznego library będą szczegóły wymaganych pól

2. **System Talii (Decks)**
   - Obecnie wszystkie fiszki użytkownika znajdują się w jednym zbiorze
   - Przyszła wersja może wymagać tabeli `decks` i klucza obcego `deck_id` w `flashcards`

3. **Historia Odpowiedzi**
   - Tabela `review_history` do przechowywania historii sesji nauki (dla analizy postępów)

4. **Przechowywanie Tekstu Źródłowego**
   - Obecnie przechowywany jest tylko hash
   - Rozważyć dodanie `source_text` (TEXT) dla możliwości ponownego przetworzenia

### 6.6. Konwencje Nazewnictwa

- **Tabele**: liczba mnoga, snake_case (`flashcards`, `generation_error_logs`)
- **Kolumny**: snake_case (`user_id`, `source_text_hash`, `accepted_full_count`)
- **ENUM**: sufiks `_enum`, wartości w kebab-case (`flashcard_source_enum`, `'ai-full'`)
- **Indeksy**: prefiks `idx_`, następnie nazwa tabeli i kolumny (`idx_flashcards_user_id`)
- **Polityki RLS**: opisowe nazwy w cudzysłowie (`"Users can view own flashcards"`)
- **Triggery**: sufiks opisujący akcję (`update_flashcards_updated_at`)

---

## 7. Podsumowanie Struktury

| Tabela | Liczba Kolumn | Główne Powiązania | Cel |
|--------|---------------|-------------------|-----|
| **auth.users** | (zarządzane przez Supabase) | Centralna encja użytkowników | Autentykacja i autoryzacja |
| **flashcards** | 8 | users, generations | Przechowywanie treści edukacyjnych |
| **generations** | 10 | users | Statystyki i metadane sesji AI |
| **generation_error_logs** | 7 | users | Audyt błędów komunikacji z LLM |

**Całkowita liczba relacji**: 4 (3 obowiązkowe + 1 opcjonalna)

**Całkowita liczba indeksów**: 6 (5 standardowych + 1 unikalny)

**Całkowita liczba polityk RLS**: 13 (4 operacje × 3 tabele + 1 wyjątek)

