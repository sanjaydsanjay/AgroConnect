-- AgriConnect backend test harness
-- Creates a temporary `tests` schema of assertion helpers used by */*.sql
-- test files. Running state is scoped to the calling transaction
-- (set_config is_local = false intentionally so role + JWT claims survive
-- across multiple checks within one psql run).

CREATE SCHEMA IF NOT EXISTS tests;
GRANT USAGE ON SCHEMA tests TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION tests.pass(msg text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'PASS: %', msg;
END
$$;

CREATE OR REPLACE FUNCTION tests.fail(msg text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'FAIL: %', msg;
END
$$;

CREATE OR REPLACE FUNCTION tests.expect_ok(p_name text, p_sql text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  EXECUTE p_sql;
  PERFORM tests.pass(p_name);
EXCEPTION WHEN OTHERS THEN
  PERFORM tests.fail(p_name || ' -> unexpected error: ' || SQLERRM);
END
$$;

CREATE OR REPLACE FUNCTION tests.expect_error(p_name text, p_sql text, p_expected text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
    PERFORM tests.fail(p_name || ' -> expected an error but the statement succeeded');
  EXCEPTION WHEN OTHERS THEN
    IF p_expected IS NULL OR position(p_expected IN SQLERRM) > 0 THEN
      PERFORM tests.pass(p_name);
    ELSE
      PERFORM tests.fail(p_name || ' -> unexpected error: ' || SQLERRM);
    END IF;
  END;
END
$$;

CREATE OR REPLACE FUNCTION tests.expect_eq(p_name text, p_sql text, p_expected text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_result text;
BEGIN
  EXECUTE p_sql INTO v_result;
  IF COALESCE(v_result, '') = p_expected THEN
    PERFORM tests.pass(p_name);
  ELSE
    PERFORM tests.fail(p_name || format(' -> expected %s but got %s', p_expected, v_result));
  END IF;
EXCEPTION WHEN OTHERS THEN
  PERFORM tests.fail(p_name || ' -> error: ' || SQLERRM);
END
$$;

-- Switch identity to a given role + auth identity (mimics a logged-in user).
-- postgres can SET ROLE to any existing role; auth.* GUCs make
-- auth.uid()/auth.role() resolve to the impersonated identity.
CREATE OR REPLACE FUNCTION tests.set_identity(p_role text, p_sub uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  EXECUTE format('SET ROLE %I', p_role);
  PERFORM set_config('request.jwt.claim.sub', p_sub::text, false);
  PERFORM set_config('request.jwt.claim.role', p_role, false);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', p_sub::text, 'role', p_role)::text,
    false
  );
END
$$;

CREATE OR REPLACE FUNCTION tests.reset_identity()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', false);
  PERFORM set_config('request.jwt.claim.role', '', false);
  PERFORM set_config('request.jwt.claims', '', false);
END
$$;

-- Sanity: assert a database object/flag without busting the transaction
CREATE OR REPLACE FUNCTION tests.expect_rls_enabled(p_name text, p_table text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_rls boolean;
BEGIN
  SELECT relrowsecurity INTO v_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = p_table;
  IF v_rls = true THEN
    PERFORM tests.pass(p_name);
  ELSE
    PERFORM tests.fail(p_name || ' -> RLS is NOT enabled on ' || p_table);
  END IF;
END
$$;