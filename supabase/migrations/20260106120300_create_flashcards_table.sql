-- ============================================================================
-- migration: create flashcards table
-- description: creates main table for storing user flashcard content
-- affected tables: flashcards (new)
-- special considerations:
--   - varchar length limits enforce content discipline and optimize storage
--   - generation_id uses on delete set null to preserve flashcards when generation is deleted
--   - source enum tracks flashcard origin for analytics
-- ============================================================================

-- create flashcards table to store user's flashcard content
create table flashcards (
    -- primary key: unique identifier for each flashcard
    id uuid primary key default gen_random_uuid(),
    
    -- foreign key: owner of the flashcard
    -- on delete cascade ensures user data is completely removed when account is deleted (gdpr compliance)
    user_id uuid not null references auth.users(id) on delete cascade,
    
    -- foreign key: optional link to ai generation session
    -- on delete set null preserves flashcards even if generation session is deleted
    -- this allows users to keep flashcards while cleaning up generation history
    generation_id uuid references generations(id) on delete set null,
    
    -- flashcard content with length constraints
    -- front: question side, limited to 200 characters for concise questions
    -- back: answer side, limited to 500 characters for detailed but focused answers
    front varchar(200) not null,
    back varchar(500) not null,
    
    -- source tracking for analytics and transparency
    source flashcard_source_type not null,
    
    -- audit timestamps
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- add comments for documentation
comment on table flashcards is 'stores user flashcard content with question-answer pairs';
comment on column flashcards.front is 'question/prompt side of flashcard (max 200 characters)';
comment on column flashcards.back is 'answer/explanation side of flashcard (max 500 characters)';
comment on column flashcards.source is 'tracks origin of flashcard content for analytics';
comment on column flashcards.generation_id is 'optional reference to ai generation session that created this flashcard';

-- create trigger to automatically update updated_at timestamp
create trigger update_flashcards_modtime
    before update on flashcards
    for each row
    execute function update_updated_at_column();

-- ============================================================================
-- row level security (rls) configuration
-- ============================================================================

-- enable rls to ensure users can only access their own flashcards
alter table flashcards enable row level security;

-- policy: allow authenticated users to select their own flashcards
create policy "authenticated users can select own flashcards"
    on flashcards
    for select
    to authenticated
    using (auth.uid() = user_id);

-- policy: allow authenticated users to insert their own flashcards
create policy "authenticated users can insert own flashcards"
    on flashcards
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: allow authenticated users to update their own flashcards
create policy "authenticated users can update own flashcards"
    on flashcards
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- policy: allow authenticated users to delete their own flashcards
create policy "authenticated users can delete own flashcards"
    on flashcards
    for delete
    to authenticated
    using (auth.uid() = user_id);

