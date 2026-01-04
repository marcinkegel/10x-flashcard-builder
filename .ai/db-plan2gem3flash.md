# Schemat Bazy Danych PostgreSQL - Flashcard Builder

Dokument zawiera projekt struktury bazy danych dla aplikacji Flashcard Builder, zoptymalizowany pod kątem platformy Supabase i wymagań MVP.

## 1. Tabele i Typy Danych

### Typy Wyliczeniowe (ENUM)
| Nazwa Typu | Wartości | Opis |
| :--- | :--- | :--- |
| `flashcard_source_type` | `'ai-full'`, `'ai-edited'`, `'manual'` | Określa pochodzenie treści fiszki |

---

### Tabela: `generations`
Przechowuje metadane i statystyki sesji generowania fiszek przez AI.

| Kolumna | Typ Danych | Ograniczenia | Opis |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator sesji |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Właściciel sesji |
| `source_text_hash` | `CHAR(64)` | `NOT NULL` | Hash SHA-256 tekstu wejściowego |
| `source_text_length` | `INTEGER` | `NOT NULL`, `CHECK (length BETWEEN 1000 AND 10000)` | Długość tekstu źródłowego |
| `model_name` | `VARCHAR` | `NOT NULL` | Nazwa wykorzystanego modelu LLM |
| `count_generated` | `INTEGER` | `NOT NULL DEFAULT 0` | Liczba wygenerowanych propozycji |
| `count_accepted_unedited` | `INTEGER` | `NOT NULL DEFAULT 0` | Zaakceptowane bez zmian |
| `count_accepted_edited` | `INTEGER` | `NOT NULL DEFAULT 0` | Zaakceptowane po edycji |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Data utworzenia |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Data ostatniej aktualizacji |

---

### Tabela: `flashcards`
Główna tabela przechowująca treść fiszek użytkownika.

| Kolumna | Typ Danych | Ograniczenia | Opis |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator fiszki |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Właściciel fiszki |
| `generation_id` | `UUID` | `NULLABLE`, `REFERENCES generations(id) ON DELETE SET NULL` | Powiązanie z sesją AI |
| `front` | `VARCHAR(200)` | `NOT NULL` | Treść pytania |
| `back` | `VARCHAR(500)` | `NOT NULL` | Treść odpowiedzi |
| `source` | `flashcard_source_type` | `NOT NULL` | Źródło pochodzenia fiszki |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Data utworzenia |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Data ostatniej aktualizacji |

---

### Tabela: `generation_error_logs`
Tabela audytowa przechowująca logi błędów komunikacji z LLM.

| Kolumna | Typ Danych | Ograniczenia | Opis |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator logu |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Użytkownik, który wywołał akcję |
| `generation_id` | `UUID` | `NULLABLE`, `REFERENCES generations(id) ON DELETE SET NULL` | Powiązanie z sesją (jeśli powstała) |
| `error_code` | `VARCHAR` | `NOT NULL` | Kod błędu (np. API_TIMEOUT, LLM_PARSE_ERROR) |
| `error_message` | `TEXT` | `NOT NULL` | Pełna treść komunikatu o błędzie |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Data wystąpienia błędu |

---

## 2. Relacje

1.  **`auth.users` -> `flashcards`**: 1:N (Jeden użytkownik może mieć wiele fiszek).
2.  **`auth.users` -> `generations`**: 1:N (Jeden użytkownik może przeprowadzić wiele sesji AI).
3.  **`generations` -> `flashcards`**: 1:N (Jedna sesja generowania może skutkować wieloma fiszkami).
4.  **`auth.users` -> `generation_error_logs`**: 1:N (Audyt błędów dla użytkownika).
5.  **`generations` -> `generation_error_logs`**: 1:N (Sesja może posiadać wiele logów błędów).

---

## 3. Indeksy

| Tabela | Kolumny | Typ | Cel |
| :--- | :--- | :--- | :--- |
| `flashcards` | `user_id` | B-Tree | Przyspieszenie pobierania fiszek użytkownika |
| `flashcards` | `generation_id` | B-Tree | Filtrowanie fiszek po sesji AI |
| `generations` | `user_id` | B-Tree | Pobieranie statystyk użytkownika |
| `generations` | `user_id`, `source_text_hash` | **UNIQUE** | Zapobieganie powielaniu sesji dla tego samego tekstu |
| `generation_error_logs` | `user_id` | B-Tree | Analiza błędów użytkownika |

---

## 4. Zasady PostgreSQL (RLS & Triggers)

### Row Level Security (RLS)
Wszystkie tabele mają włączone RLS. Dostęp jest ograniczony do właściciela danych (`user_id`).

```sql
-- Przykład polityki dla tabeli flashcards
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own flashcards" 
ON flashcards 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```
*(Identyczne polityki obowiązują dla `generations` oraz `generation_error_logs`)*.

### Automatyzacja `updated_at`
Zastosowanie funkcji wyzwalacza do automatycznej aktualizacji znacznika czasu przy modyfikacji wiersza.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_flashcards_modtime
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generations_modtime
    BEFORE UPDATE ON generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 5. Dodatkowe Uwagi Projektowe

1.  **Integralność danych**: Zastosowano `ON DELETE CASCADE` dla klucza `user_id`, co gwarantuje automatyczne usunięcie danych przy usuwaniu konta (zgodność z RODO).
2.  **Wydajność**: Użycie `VARCHAR` z limitami (200/500 znaków) dla fiszek zamiast typu `TEXT` pozwala na lepszą optymalizację miejsca i narzuca dyscyplinę w tworzeniu treści edukacyjnych.
3.  **Bezpieczeństwo sesji**: Unikalny indeks na `(user_id, source_text_hash)` zapobiega niepotrzebnemu zużyciu tokenów LLM w przypadku wielokrotnego wysyłania tego samego tekstu przez użytkownika.
4.  **Skalowalność**: Wybór UUID jako kluczy głównych zapewnia unikalność w skali globalnej i ułatwia ewentualną synchronizację danych lub integrację z zewnętrznymi usługami w przyszłości.
5.  **Analityka**: Pola `count_generated`, `count_accepted_unedited` i `count_accepted_edited` w tabeli `generations` umożliwiają precyzyjne mierzenie skuteczności modelu AI zgodnie z KPI określonymi w PRD.

