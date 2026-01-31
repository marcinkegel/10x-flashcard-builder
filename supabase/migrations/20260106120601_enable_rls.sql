-- ============================================================================
-- migration: enable rls
-- description: re-enables row level security on all tables for production/testing
-- affected tables: generations, flashcards, generation_error_logs
-- ============================================================================

-- enable rls on generations table
alter table generations enable row level security;

-- enable rls on flashcards table
alter table flashcards enable row level security;

-- enable rls on generation_error_logs table
alter table generation_error_logs enable row level security;

-- ============================================================================
-- note: this migration reverses the effect of:
-- 20260106120600_disable_rls_for_development.sql
-- ============================================================================
