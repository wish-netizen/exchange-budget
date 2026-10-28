ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS converted_amount_krw numeric(20, 2);

UPDATE expenses
SET converted_amount_krw = round(amount * rate_to_krw, 2)
WHERE converted_amount_krw IS NULL;

ALTER TABLE expenses
ALTER COLUMN converted_amount_krw SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expenses_converted_amount_krw_check'
      AND conrelid = 'expenses'::regclass
  ) THEN
    ALTER TABLE expenses
    ADD CONSTRAINT expenses_converted_amount_krw_check
    CHECK (converted_amount_krw >= 0);
  END IF;
END
$$;