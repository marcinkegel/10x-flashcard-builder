1. Lista tabel z ich kolumnami, typami danych i ograniczeniami
- `flashcards`
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `generation_id UUID REFERENCES generations(id) ON DELETE SET NULL`
  - `front VARCHAR(200) NOT NULL`
  - `back VARCHAR(500) NOT NULL`
  - `source flashcard_source NOT NULL`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `CHECK (char_length(front) <= 200 AND char_length(back) <= 500)`
- `generations`
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `source_text_hash CHAR(64) NOT NULL`
  - `source_text_length INTEGER NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000)`
  - `model_name VARCHAR(200) NOT NULL`
  - `generated_count INTEGER NOT NULL DEFAULT 0`
  - `accepted_without_edit_count INTEGER NOT NULL DEFAULT 0`
  - `accepted_with_edit_count INTEGER NOT NULL DEFAULT 0`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `UNIQUE (user_id, source_text_hash)`
- `generation_error_logs`
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE`
  - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `error_code VARCHAR(64) NOT NULL`
  - `error_body TEXT NOT NULL`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- typy pomocnicze i rozszerzenia
  - `flashcard_source ENUM ('ai-full', 'ai-edited', 'manual')`
  - `CREATE EXTENSION IF NOT EXISTS pgcrypto;` (potrzebna do `gen_random_uuid()`)
  - `CREATE FUNCTION set_updated_at() RETURNS trigger ...` aktualizująca `UPDATED_AT` przed aktualizacją rekordu

2. Relacje między tabelami
- `users (auth.users)` 1:N `generations` przez `user_id` (ON DELETE CASCADE, jeden użytkownik może posiadać wiele sesji AI)
- `generations` 1:N `flashcards` przez `generation_id` (opcjonalne powiązanie, usunięcie sesji nie kasuje fiszek)
- `generations` 1:N `generation_error_logs` przez `generation_id` (każda sesja może mieć wiele logów błędów)
- `users (auth.users)` 1:N `flashcards` i `generation_error_logs` przez `user_id` (wszystkie dane powiązane z użytkownikiem podlegają RODO i są kaskadowo usuwane przy usunięciu konta)

3. Indeksy
- `CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);`
- `CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);`
- `CREATE INDEX idx_generations_user_id ON generations(user_id);`
- `CREATE UNIQUE INDEX idx_generations_user_hash ON generations(user_id, source_text_hash);`
- `CREATE INDEX idx_generation_error_logs_user_id ON generation_error_logs(user_id);`
- `CREATE INDEX idx_generation_error_logs_generation_id ON generation_error_logs(generation_id);`

4. Zasady PostgreSQL
- RLS:
  - `ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;`
  - `CREATE POLICY flashcards_owner ON flashcards USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
  - `ALTER TABLE generations ENABLE ROW LEVEL SECURITY;`
  - `CREATE POLICY generations_owner ON generations USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
  - `ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;`
  - `CREATE POLICY generation_error_logs_owner ON generation_error_logs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
- Trigger:
  - `CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;`
  - `CREATE TRIGGER flashcards_set_updated_at BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION set_updated_at();`
  - `CREATE TRIGGER generations_set_updated_at BEFORE UPDATE ON generations FOR EACH ROW EXECUTE FUNCTION set_updated_at();`
- Dodatkowe ograniczenia:
  - `CHECK` w `generations.source_text_length` zapewnia weryfikację długości tekstu źródłowego (1 000–10 000 znaków).
  - `UNIQUE (user_id, source_text_hash)` zapobiega wielokrotnemu generowaniu z tego samego tekstu przez jednego użytkownika.

5. Dodatkowe uwagi
- Liczniki są zawsze niepuste dzięki `NOT NULL DEFAULT 0`, co upraszcza raportowanie statystyk i metryk.
- `front`/`back` w `flashcards` są ograniczone do 200/500 znaków zarówno typem `VARCHAR`, jak i dodatkowym `CHECK`, zgodnie z PRD i ustaleniami z sesji planowania.
- `generation_error_logs` przechowuje pełny `error_body`, więc można łatwo udostępniać użytkownikowi komunikat o błędzie oraz analizować przyczyny niepowodzeń AI.
- Schemat uwzględnia bezpieczeństwo i skalowalność środowiska Supabase + PostgreSQL: RLS, kaskadowe usuwanie, indeksowanie i trigger `updated_at` gwarantują spójność danych.

