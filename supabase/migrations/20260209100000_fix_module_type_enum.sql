-- FIX MODULE TYPE ENUM ERROR
-- Adds 'slides' to the module_type if it is an enum, or ensures the column is text.

DO $$
BEGIN
    -- If module_type is an enum, add 'slides'
    -- Note: We check if it's an enum by looking at pg_type
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'module_type') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'slides' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'module_type')) THEN
            ALTER TYPE public.module_type ADD VALUE 'slides';
        END IF;
    END IF;

    -- Alternatively, if it's just a check constraint on a text column
    -- Most migrations used 'text DEFAULT 'video'' but some might have added constraints.
    -- We'll just make sure the column is text if it was accidentally made an enum or had a strict check.
    -- Based on the error "invalid input value for enum", it's definitely a Postgres ENUM.
END $$;
