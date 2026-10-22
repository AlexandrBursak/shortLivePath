-- Run only against the disposable verification database after staged up.sql.
-- No fixture survives this transaction. This does not test application/Redis behavior.
BEGIN;
SET LOCAL TIME ZONE 'UTC';

CREATE TEMP TABLE check_results (label text PRIMARY KEY);

CREATE FUNCTION pg_temp.expect_rejection(label text, statement text, expected_state text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    observed_state text;
BEGIN
    BEGIN
        EXECUTE statement;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS observed_state = RETURNED_SQLSTATE;
    END;
    IF observed_state IS DISTINCT FROM expected_state THEN
        RAISE EXCEPTION '%: expected SQLSTATE %, got %', label, expected_state, observed_state;
    END IF;
    INSERT INTO check_results VALUES (label);
END;
$$;

DO $$
DECLARE
    fields text[];
BEGIN
    SELECT array_agg(column_name::text ORDER BY ordinal_position) INTO fields
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'link_lifecycles';
    IF fields IS DISTINCT FROM ARRAY['id', 'token_digest', 'created_at', 'expires_at'] THEN
        RAISE EXCEPTION 'Durable field allowlist mismatch: %', fields;
    END IF;
    IF (SELECT count(*) FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'link_lifecycles'
        AND is_nullable = 'NO' AND column_default IS NULL) <> 4 THEN
        RAISE EXCEPTION 'Expected four NOT NULL columns without defaults';
    END IF;
    IF (SELECT count(*) FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'link_lifecycles') <> 2 THEN
        RAISE EXCEPTION 'Expected only PK and digest UNIQUE indexes';
    END IF;
    INSERT INTO check_results VALUES ('durable shape and indexes');
END;
$$;

-- AC-04/AC-05: every whole-minute choice is representable, including both bounds.
INSERT INTO link_lifecycles (id, token_digest, created_at, expires_at)
SELECT md5('synthetic-lifecycle-' || n)::uuid,
       decode(lpad(to_hex(n), 64, '0'), 'hex'),
       '2026-01-01 00:00:00.123+00'::timestamptz,
       '2026-01-01 00:00:00.123+00'::timestamptz + n * interval '1 minute'
FROM generate_series(1, 1440) AS n;

DO $$
BEGIN
    IF (SELECT count(*) FROM link_lifecycles) <> 1440 THEN
        RAISE EXCEPTION 'Not every integer lifetime was stored';
    END IF;
    INSERT INTO check_results VALUES ('all 1440 whole-minute lifetimes');
END;
$$;

-- Use an extra digest/id absent from the generated fixture range.
CREATE TEMP TABLE valid_fixture AS
SELECT '00000000-0000-4000-8000-000000000001'::uuid AS id,
       decode(repeat('ff', 32), 'hex') AS token_digest,
       '2026-01-01 00:00:00.123+00'::timestamptz AS created_at,
       '2026-01-01 01:00:00.123+00'::timestamptz AS expires_at;

-- AC-09: insertion and expired recognition metadata survive a replay of up.sql.
INSERT INTO link_lifecycles SELECT * FROM valid_fixture;

SELECT pg_temp.expect_rejection('duplicate UUID',
    'INSERT INTO link_lifecycles SELECT id, decode(repeat(''aa'',32),''hex''), created_at, expires_at FROM valid_fixture', '23505');
SELECT pg_temp.expect_rejection('duplicate digest',
    'INSERT INTO link_lifecycles SELECT ''00000000-0000-4000-8000-000000000002''::uuid, token_digest, created_at, expires_at FROM valid_fixture', '23505');

DO $$
DECLARE
    field text;
    test_case record;
    replacement text;
    statement text;
BEGIN
    FOREACH field IN ARRAY ARRAY['id', 'token_digest', 'created_at', 'expires_at'] LOOP
        statement := format('INSERT INTO link_lifecycles SELECT %s, %s, %s, %s FROM valid_fixture',
            CASE WHEN field = 'id' THEN 'NULL::uuid' ELSE 'id' END,
            CASE WHEN field = 'token_digest' THEN 'NULL::bytea' ELSE 'token_digest' END,
            CASE WHEN field = 'created_at' THEN 'NULL::timestamptz' ELSE 'created_at' END,
            CASE WHEN field = 'expires_at' THEN 'NULL::timestamptz' ELSE 'expires_at' END);
        PERFORM pg_temp.expect_rejection('null ' || field, statement, '23502');
    END LOOP;

    FOR test_case IN SELECT * FROM (VALUES
        ('short digest', 'decode(repeat(''aa'',31),''hex'')'),
        ('long digest', 'decode(repeat(''aa'',33),''hex'')'),
        ('empty digest', '''''::bytea')
    ) AS c(label, expression) LOOP
        PERFORM pg_temp.expect_rejection(test_case.label,
            format('INSERT INTO link_lifecycles SELECT ''00000000-0000-4000-8000-000000000003''::uuid, %s, created_at, expires_at FROM valid_fixture', test_case.expression), '23514');
    END LOOP;

    FOR test_case IN SELECT * FROM (VALUES
        ('negative duration', 'created_at - interval ''60 seconds'''),
        ('zero duration', 'created_at'),
        ('under one minute', 'created_at + interval ''59 seconds'''),
        ('fractional minute', 'created_at + interval ''90 seconds'''),
        ('fractional second', 'created_at + interval ''60.001 seconds'''),
        ('over one day', 'created_at + interval ''86460 seconds'''),
        ('positive infinity', '''infinity''::timestamptz'),
        ('negative infinity', '''-infinity''::timestamptz')
    ) AS c(label, expression) LOOP
        PERFORM pg_temp.expect_rejection(test_case.label,
            format('INSERT INTO link_lifecycles SELECT ''00000000-0000-4000-8000-000000000004''::uuid, decode(repeat(''ee'',32),''hex''), created_at, %s FROM valid_fixture', test_case.expression), '23514');
    END LOOP;

    PERFORM pg_temp.expect_rejection('infinite creation',
        'INSERT INTO link_lifecycles VALUES (''00000000-0000-4000-8000-000000000005'', decode(repeat(''dd'',32),''hex''), ''-infinity'', ''2026-01-01 00:00:00+00'')', '23514');
END;
$$;

-- AC-04: elapsed duration, not calendar arithmetic or connection timezone.
SET LOCAL TIME ZONE 'America/New_York';
INSERT INTO link_lifecycles VALUES (
    '00000000-0000-4000-8000-000000000006', decode(repeat('cc',32),'hex'),
    '2026-03-08 01:30:00-05', '2026-03-08 03:30:00-04'
);
INSERT INTO check_results VALUES ('DST elapsed-hour accepted');
SELECT pg_temp.expect_rejection('DST calendar-day not whole elapsed day',
    'INSERT INTO link_lifecycles VALUES (''00000000-0000-4000-8000-000000000007'', decode(repeat(''bb'',32),''hex''), ''2026-11-01 00:00:00-04'', ''2026-11-02 00:00:00-05'')', '23514');

-- TTL belongs only to Redis: no durable expiration trigger/deletion machinery.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger
               WHERE tgrelid = 'link_lifecycles'::regclass AND NOT tgisinternal) THEN
        RAISE EXCEPTION 'Unexpected durable lifecycle trigger';
    END IF;
    IF (SELECT count(*) FROM link_lifecycles WHERE expires_at < '2026-10-22+00'::timestamptz) <> 1442 THEN
        RAISE EXCEPTION 'Expired fixture metadata missing';
    END IF;
    INSERT INTO check_results VALUES ('expired metadata retained without triggers');
END;
$$;

SELECT label FROM check_results ORDER BY label;
SELECT count(*) AS passed_schema_checks FROM check_results;
ROLLBACK;
