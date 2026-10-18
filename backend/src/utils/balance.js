import { AppError } from './AppError.js';
import { ERROR_CODES } from '../config/constants.js';

/**
 * Convierte un número a centavos enteros para evitar problemas de coma flotante.
 * @param {number|string} n
 * @returns {number} Centavos enteros
 */
export const toCents = (n) => Math.round(Number(n || 0) * 100);

/**
 * Bloqueo consultivo de transacción a nivel de BD para evitar condiciones de carrera entre movimientos financieros.
 * @param {import('pg').PoolClient} client
 */
export const lockBalances = async (client) => {
  await client.query('SELECT pg_advisory_xact_lock(727001);');
};

/**
 * Obtiene los saldos y acumulados actuales desde v_account_balances
 * @param {import('pg').PoolClient} client
 */
export const getBalances = async (client) => {
  const sql = `SELECT * FROM v_account_balances LIMIT 1;`;
  const res = await client.query(sql);
  const row = res.rows[0] || {};
  return {
    cashRevenue: Number(row.cash_revenue || 0),
    yapeRevenue: Number(row.yape_revenue || 0),
    cashInvested: Number(row.cash_invested || 0),
    yapeInvested: Number(row.yape_invested || 0),
    ownInvested: Number(row.own_invested || 0),
    cashWithdrawn: Number(row.cash_withdrawn || 0),
    yapeWithdrawn: Number(row.yape_withdrawn || 0),
    profitWithdrawn: Number(row.profit_withdrawn || 0),
    reimbursed: Number(row.reimbursed || 0),
    cashBalance: Number(row.cash_balance || 0),
    yapeBalance: Number(row.yape_balance || 0),
    pendingReimbursement: Number(row.pending_reimbursement || 0),
  };
};

/**
 * Verifica las invariantes del modelo de negocio tras una modificación:
 * 1. cash_balance >= 0
 * 2. yape_balance >= 0
 * 3. pending_reimbursement >= 0
 *
 * @param {import('pg').PoolClient} client
 * @param {{
 *   preBalances?: object,
 *   requestedCash?: number,
 *   requestedYape?: number
 * }} [context]
 * @returns {Promise<object>} Saldos actualizados
 */
export const assertInvariants = async (client, context = {}) => {
  const postBalances = await getBalances(client);
  const pre = context.preBalances || postBalances;

  if (postBalances.cashBalance < 0) {
    const available = pre.cashBalance;
    const requested = context.requestedCash !== undefined
      ? context.requestedCash
      : Math.abs(postBalances.cashBalance);

    throw new AppError(
      409,
      ERROR_CODES.INSUFFICIENT_BALANCE,
      'Saldo insuficiente en Efectivo para completar la operación',
      {
        account: 'cash',
        available: Math.max(available, 0),
        requested,
      }
    );
  }

  if (postBalances.yapeBalance < 0) {
    const available = pre.yapeBalance;
    const requested = context.requestedYape !== undefined
      ? context.requestedYape
      : Math.abs(postBalances.yapeBalance);

    throw new AppError(
      409,
      ERROR_CODES.INSUFFICIENT_BALANCE,
      'Saldo insuficiente en Yape para completar la operación',
      {
        account: 'yape',
        available: Math.max(available, 0),
        requested,
      }
    );
  }

  if (postBalances.pendingReimbursement < 0) {
    throw new AppError(
      409,
      ERROR_CODES.REIMBURSEMENT_EXCEEDS_PENDING,
      'La devolución excede el aporte propio pendiente',
      {
        pending: Math.max(pre.pendingReimbursement, 0),
      }
    );
  }

  return postBalances;
};
