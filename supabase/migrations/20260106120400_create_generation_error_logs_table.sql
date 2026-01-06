-- ============================================================================
-- migration: create generation_error_logs table
-- description: creates audit table for tracking llm communication errors
-- affected tables: generation_error_logs (new)
-- special considerations:
--   - read-only table (no update/delete policies) for audit integrity
--   - stores detailed error information for debugging and monitoring
--   - includes source text metadata for correlation with generations
-- ============================================================================

-- create generation_error_logs table for error tracking and debugging
create table generation_error_logs (
    -- primary key: unique identifier for each error log entry
    id uuid primary key default gen_random_uuid(),
    
    -- foreign key: user who triggered the failed operation
    -- on delete cascade ensures user audit logs are removed with account (gdpr compliance)
    user_id uuid not null references auth.users(id) on delete cascade,
    
    -- source text metadata (same as in generations table)
    -- allows correlation between errors and successful generations
    source_text_hash char(64) not null,
    
    -- length validation ensures text is within acceptable range
    source_text_length integer not null,
    constraint check_error_source_text_length check (source_text_length between 1000 and 10000),
    
    -- llm model identifier for tracking which model failed
    model_name varchar not null,
    
    -- error details for debugging and monitoring
    error_code varchar not null,        -- standardized error code (e.g., API_TIMEOUT, LLM_PARSE_ERROR)
    error_message text not null,        -- full error message from llm service
    
    -- audit timestamp (no updated_at as logs are immutable)
    created_at timestamptz not null default now()
);

-- add comments for documentation
comment on table generation_error_logs is 'audit log for llm communication errors and failures';
comment on column generation_error_logs.source_text_hash is 'sha-256 hash of input text that caused the error';
comment on column generation_error_logs.error_code is 'standardized error code for categorizing failures';
comment on column generation_error_logs.error_message is 'detailed error message for debugging';

-- ============================================================================
-- row level security (rls) configuration
-- ============================================================================

-- enable rls to ensure users can only access their own error logs
alter table generation_error_logs enable row level security;

-- policy: allow authenticated users to select their own error logs
create policy "authenticated users can select own error logs"
    on generation_error_logs
    for select
    to authenticated
    using (auth.uid() = user_id);

-- policy: allow authenticated users to insert their own error logs
-- this allows the application to log errors on behalf of users
create policy "authenticated users can insert own error logs"
    on generation_error_logs
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- note: no update or delete policies
-- error logs are immutable audit records and should not be modified or deleted by users
-- only cascading delete from user account removal will delete logs

