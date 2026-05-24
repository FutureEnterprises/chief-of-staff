-- Harden public.update_updated_at() against search_path injection.
--
-- The Supabase advisor (lint 0011_function_search_path_mutable) flagged
-- this trigger function for having a role-mutable search_path. Without
-- a locked search_path, a malicious user with the right grants can
-- shadow a function or operator the trigger relies on (e.g. now()) and
-- get it to run their version under the trigger's invoker rights.
--
-- The function body is trivial — `NEW."updatedAt" = now(); RETURN NEW;`
-- — and only references now(), which lives in pg_catalog and resolves
-- regardless of search_path. Setting search_path to '' (the strictest
-- value) prevents any unqualified identifier from accidentally
-- resolving in a user-controlled schema.
--
-- 3 active triggers use this function; behavior is unchanged because
-- pg_catalog is always implicitly first in resolution.

ALTER FUNCTION public.update_updated_at() SET search_path = '';
