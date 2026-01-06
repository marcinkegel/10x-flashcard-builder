-- ============================================================================
-- migration: create helper functions
-- description: creates reusable database functions for common operations
-- affected: function definitions
-- ============================================================================

-- create function to automatically update the updated_at timestamp
-- this function will be used by triggers to maintain accurate modification timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    -- set updated_at to current timestamp whenever row is modified
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- add comment to document the function
comment on function update_updated_at_column() is 'trigger function that automatically updates updated_at column to current timestamp on row modification';

