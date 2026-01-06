-- ============================================================================
-- migration: create database indexes
-- description: creates indexes to optimize query performance
-- affected tables: generations, flashcards, generation_error_logs
-- special considerations:
--   - unique index on generations prevents duplicate processing
--   - btree indexes optimize common query patterns
-- ============================================================================

-- ============================================================================
-- generations table indexes
-- ============================================================================

-- index: optimize queries filtering generations by user
-- used for: fetching user's generation history, statistics aggregation
create index idx_generations_user_id 
    on generations(user_id);

-- unique index: prevent duplicate generation sessions for same user and source text
-- used for: detecting if text was already processed, preventing token waste
-- this is a critical business rule to avoid unnecessary llm api costs
create unique index idx_generations_user_source_hash 
    on generations(user_id, source_text_hash);

comment on index idx_generations_user_source_hash is 'ensures each user can only process unique source text once, preventing duplicate llm api calls';

-- ============================================================================
-- flashcards table indexes
-- ============================================================================

-- index: optimize queries filtering flashcards by user
-- used for: fetching user's flashcard collection, main application query
create index idx_flashcards_user_id 
    on flashcards(user_id);

-- index: optimize queries filtering flashcards by generation session
-- used for: showing flashcards from specific ai generation, analytics
create index idx_flashcards_generation_id 
    on flashcards(generation_id);

-- ============================================================================
-- generation_error_logs table indexes
-- ============================================================================

-- index: optimize queries filtering error logs by user
-- used for: user error history, support debugging
create index idx_generation_error_logs_user_id 
    on generation_error_logs(user_id);

-- index: optimize queries finding errors for specific source text
-- used for: correlating errors with successful generations, debugging
create index idx_generation_error_logs_source_hash 
    on generation_error_logs(source_text_hash);

