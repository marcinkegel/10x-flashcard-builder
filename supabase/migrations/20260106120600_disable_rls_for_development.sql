-- ============================================================================
-- migration: disable rls for development
-- description: temporarily disables row level security on all tables for development/testing
-- affected tables: generations, flashcards, generation_error_logs
-- ============================================================================
-- warning: this migration is for development/testing only
-- do not apply in production environment
-- this allows unrestricted access to all tables regardless of user_id
-- ============================================================================

-- disable rls on generations table
-- this allows any authenticated user to access all generation records
alter table generations disable row level security;

-- disable rls on flashcards table
-- this allows any authenticated user to access all flashcards
alter table flashcards disable row level security;

-- disable rls on generation_error_logs table
-- this allows any authenticated user to access all error logs
alter table generation_error_logs disable row level security;

-- ============================================================================
-- note: to re-enable rls, run the companion migration:
-- 20260106120601_enable_rls_for_production.sql
-- ============================================================================

