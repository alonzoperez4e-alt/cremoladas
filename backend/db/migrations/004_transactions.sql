-- 004_transactions.sql
-- Origen del dinero en inversiones (preparaciones y gastos), tabla de retiros y saldos por cuenta
-- NOTA: Este archivo documenta los cambios de esquema para Neon DB.

BEGIN;

-- 1. Columnas de pago en preparaciones
ALTER TABLE preparations
  ADD COLUMN IF NOT EXISTS paid_cash NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_yape NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_own NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Migrar registros anteriores como pagados con bolsillo propio
UPDATE preparations
  SET paid_own = investment_amount
  WHERE paid_cash = 0 AND paid_yape = 0 AND paid_own = 0 AND investment_amount > 0;

ALTER TABLE preparations
  DROP CONSTRAINT IF EXISTS chk_preparations_payment_sum;

ALTER TABLE preparations
  ADD CONSTRAINT chk_preparations_payment_sum
    CHECK (paid_cash >= 0 AND paid_yape >= 0 AND paid_own >= 0 AND (paid_cash + paid_yape + paid_own) = investment_amount);

-- 2. Columnas de pago en gastos
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS paid_cash NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_yape NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_own NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Migrar registros anteriores como pagados con bolsillo propio
UPDATE expenses
  SET paid_own = amount
  WHERE paid_cash = 0 AND paid_yape = 0 AND paid_own = 0 AND amount > 0;

ALTER TABLE expenses
  DROP CONSTRAINT IF EXISTS chk_expenses_payment_sum;

ALTER TABLE expenses
  ADD CONSTRAINT chk_expenses_payment_sum
    CHECK (paid_cash >= 0 AND paid_yape >= 0 AND paid_own >= 0 AND (paid_cash + paid_yape + paid_own) = amount);

-- 3. Triggers de compatibilidad BEFORE INSERT
CREATE OR REPLACE FUNCTION trg_preparations_default_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.paid_cash IS NULL OR NEW.paid_cash = 0) AND
     (NEW.paid_yape IS NULL OR NEW.paid_yape = 0) AND
     (NEW.paid_own IS NULL OR NEW.paid_own = 0) THEN
    NEW.paid_own := NEW.investment_amount;
    NEW.paid_cash := 0;
    NEW.paid_yape := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_preparations_payment ON preparations;
CREATE TRIGGER trg_preparations_payment
  BEFORE INSERT ON preparations
  FOR EACH ROW
  EXECUTE FUNCTION trg_preparations_default_payment();

CREATE OR REPLACE FUNCTION trg_expenses_default_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.paid_cash IS NULL OR NEW.paid_cash = 0) AND
     (NEW.paid_yape IS NULL OR NEW.paid_yape = 0) AND
     (NEW.paid_own IS NULL OR NEW.paid_own = 0) THEN
    NEW.paid_own := NEW.amount;
    NEW.paid_cash := 0;
    NEW.paid_yape := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_expenses_payment ON expenses;
CREATE TRIGGER trg_expenses_payment
  BEFORE INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION trg_expenses_default_payment();

-- 4. Tabla de retiros (withdrawals)
CREATE TABLE IF NOT EXISTS withdrawals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  withdrawal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  kind VARCHAR(20) NOT NULL CONSTRAINT chk_withdrawals_kind CHECK (kind IN ('profit', 'reimbursement')),
  cash_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  yape_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  description VARCHAR(255),
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_withdrawals_amounts CHECK (cash_amount >= 0 AND yape_amount >= 0 AND (cash_amount + yape_amount) > 0)
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_date ON withdrawals (withdrawal_date DESC);

-- 5. Vista de saldos por cuenta v_account_balances
CREATE OR REPLACE VIEW v_account_balances AS
WITH
rev AS (
  SELECT
    COALESCE(SUM(total) FILTER (WHERE payment_method = 'cash'), 0) AS cash_revenue,
    COALESCE(SUM(total) FILTER (WHERE payment_method = 'yape'), 0) AS yape_revenue
  FROM sales
),
inv AS (
  SELECT
    COALESCE(SUM(paid_cash), 0) AS cash_invested,
    COALESCE(SUM(paid_yape), 0) AS yape_invested,
    COALESCE(SUM(paid_own), 0)  AS own_invested
  FROM (
    SELECT paid_cash, paid_yape, paid_own FROM preparations
    UNION ALL
    SELECT paid_cash, paid_yape, paid_own FROM expenses
  ) t
),
wth AS (
  SELECT
    COALESCE(SUM(cash_amount), 0) AS cash_withdrawn,
    COALESCE(SUM(yape_amount), 0) AS yape_withdrawn,
    COALESCE(SUM(cash_amount + yape_amount) FILTER (WHERE kind = 'profit'), 0) AS profit_withdrawn,
    COALESCE(SUM(cash_amount + yape_amount) FILTER (WHERE kind = 'reimbursement'), 0) AS reimbursed
  FROM withdrawals
)
SELECT
  rev.cash_revenue,
  rev.yape_revenue,
  inv.cash_invested,
  inv.yape_invested,
  inv.own_invested,
  wth.cash_withdrawn,
  wth.yape_withdrawn,
  wth.profit_withdrawn,
  wth.reimbursed,
  (rev.cash_revenue - inv.cash_invested - wth.cash_withdrawn) AS cash_balance,
  (rev.yape_revenue - inv.yape_invested - wth.yape_withdrawn) AS yape_balance,
  (inv.own_invested - wth.reimbursed) AS pending_reimbursement
FROM rev, inv, wth;

COMMIT;
