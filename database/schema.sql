CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_hash text NOT NULL UNIQUE,
  start_date date NOT NULL,
  initial_fund_amount numeric(20, 6) NOT NULL CHECK (initial_fund_amount >= 0),
  initial_fund_currency char(3) NOT NULL,
  initial_fund_rate_to_krw numeric(18, 8) NOT NULL CHECK (initial_fund_rate_to_krw > 0),
  initial_fund_rate_source text NOT NULL CHECK (initial_fund_rate_source IN ('frankfurter', 'manual', 'krw')),
  initial_fund_rate_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ledgers_initial_krw_rate_check CHECK (
    initial_fund_currency <> 'KRW' OR initial_fund_rate_to_krw = 1
  ),
  CONSTRAINT ledgers_initial_krw_source_check CHECK (
    initial_fund_currency <> 'KRW' OR initial_fund_rate_source = 'krw'
  )
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id uuid NOT NULL REFERENCES ledgers(id) ON DELETE CASCADE,
  section text NOT NULL CHECK (section IN ('preparation', 'living', 'travel')),
  date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric(20, 6) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL,
  rate_to_krw numeric(18, 8) NOT NULL CHECK (rate_to_krw > 0),
  rate_source text NOT NULL CHECK (rate_source IN ('frankfurter', 'manual', 'krw')),
  rate_date date NOT NULL,
  converted_amount_krw numeric(20, 2) NOT NULL CHECK (converted_amount_krw >= 0),
  memo text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT expenses_krw_rate_check CHECK (currency <> 'KRW' OR rate_to_krw = 1),
  CONSTRAINT expenses_krw_source_check CHECK (currency <> 'KRW' OR rate_source = 'krw')
);

CREATE TABLE IF NOT EXISTS incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id uuid NOT NULL REFERENCES ledgers(id) ON DELETE CASCADE,
  date date NOT NULL,
  category text NOT NULL CHECK (category IN ('scholarship', 'allowance', 'part_time', 'other')),
  description text NOT NULL,
  amount numeric(20, 6) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL,
  rate_to_krw numeric(18, 8) NOT NULL CHECK (rate_to_krw > 0),
  rate_source text NOT NULL CHECK (rate_source IN ('frankfurter', 'manual', 'krw')),
  rate_date date NOT NULL,
  memo text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT incomes_krw_rate_check CHECK (currency <> 'KRW' OR rate_to_krw = 1),
  CONSTRAINT incomes_krw_source_check CHECK (currency <> 'KRW' OR rate_source = 'krw')
);

CREATE INDEX IF NOT EXISTS expenses_ledger_date_idx ON expenses (ledger_id, date);
CREATE INDEX IF NOT EXISTS expenses_ledger_section_date_idx ON expenses (ledger_id, section, date);
CREATE INDEX IF NOT EXISTS incomes_ledger_date_idx ON incomes (ledger_id, date);