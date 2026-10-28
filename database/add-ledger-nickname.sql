ALTER TABLE ledgers
ADD COLUMN IF NOT EXISTS nickname varchar(8);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ledgers_nickname_length_check'
      AND conrelid = 'ledgers'::regclass
  ) THEN
    ALTER TABLE ledgers
    ADD CONSTRAINT ledgers_nickname_length_check
    CHECK (nickname IS NULL OR char_length(btrim(nickname)) BETWEEN 1 AND 8);
  END IF;
END
$$;