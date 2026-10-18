-- 003_payment_method.sql
-- Migración para registrar el método de pago en cada venta ('cash' = Efectivo, 'yape' = Yape)
-- NOTA: Esta migración ya fue aplicada en la base de datos de Neon. Este archivo se conserva como documentación.

BEGIN;

ALTER TABLE sales
  ADD COLUMN payment_method VARCHAR(10) NOT NULL DEFAULT 'cash'
  CONSTRAINT chk_sales_payment_method CHECK (payment_method IN ('cash', 'yape'));

COMMIT;
