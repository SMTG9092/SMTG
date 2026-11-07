
-- =====================================================
-- SMTG ERP
-- 006 - AUTOMATIC USERNAME GENERATION
-- =====================================================

-- 1. Add first and last name columns

ALTER TABLE platform.users
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);

ALTER TABLE platform.users
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);


-- 2. Prevent duplicate internal email addresses
-- Case-insensitive uniqueness

CREATE UNIQUE INDEX IF NOT EXISTS
uq_users_email_lower
ON platform.users (LOWER(email));


-- 3. Username generation function

CREATE OR REPLACE FUNCTION platform.generate_smtg_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_first VARCHAR(100);
    v_last VARCHAR(100);
    v_base VARCHAR(200);
    v_candidate VARCHAR(255);
    v_counter INTEGER := 0;
BEGIN

    -- Normalize first name

    v_first := LOWER(TRIM(NEW.first_name));

    v_first := TRANSLATE(
        v_first,
        'áàâäãåéèêëíìîïóòôöõúùûüçñýÿ',
        'aaaaaaeeeeiiiiooooouuuucnyy'
    );

    v_first := REGEXP_REPLACE(v_first, '[^a-z0-9]', '', 'g');


    -- Normalize last name

    v_last := LOWER(TRIM(NEW.last_name));

    v_last := TRANSLATE(
        v_last,
        'áàâäãåéèêëíìîïóòôöõúùûüçñýÿ',
        'aaaaaaeeeeiiiiooooouuuucnyy'
    );

    v_last := REGEXP_REPLACE(v_last, '[^a-z0-9]', '', 'g');


    -- Validate names

    IF v_first = '' OR v_last = '' THEN
        RAISE EXCEPTION
        'First name and last name are required';
    END IF;


    -- Base username: first initial + surname

    v_base := LEFT(v_first, 1) || '.' || v_last;

    -- Lock generation for this username base
    -- to prevent simultaneous duplicate generation

    PERFORM pg_advisory_xact_lock(
        hashtext(v_base)
    );


    -- Generate unique address

    LOOP

        IF v_counter = 0 THEN
            v_candidate := v_base;
        ELSE
            v_candidate :=
                LEFT(v_first, 1)
                || v_counter::TEXT
                || '.'
                || v_last;
        END IF;

        v_candidate := v_candidate || '@smtg.com';

        EXIT WHEN NOT EXISTS (
            SELECT 1
            FROM platform.users
            WHERE LOWER(email) = LOWER(v_candidate)
        );

        v_counter := v_counter + 1;

    END LOOP;


    -- Automatically assign internal SMTG address

    NEW.email := v_candidate;

    -- Automatically build full name

    NEW.full_name :=
        TRIM(NEW.first_name || ' ' || NEW.last_name);

    RETURN NEW;

END;
$$;


-- 4. Create automatic generation trigger

DROP TRIGGER IF EXISTS
trg_generate_smtg_email
ON platform.users;

CREATE TRIGGER trg_generate_smtg_email
BEFORE INSERT ON platform.users
FOR EACH ROW
EXECUTE FUNCTION platform.generate_smtg_email();


-- =====================================================
-- END OF SMTG 006
-- =====================================================

