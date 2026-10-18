import { query } from '../../db/pool.js';

const MOVEMENTS_CTE = `
  WITH all_movements AS (
    -- Ingresos por jornada y método de pago
    SELECT
      ('income-' || sd.id || '-' || s.payment_method) AS id,
      TO_CHAR(sd.sale_date, 'YYYY-MM-DD') AS date,
      'income' AS type,
      s.payment_method AS account,
      SUM(s.total) AS amount,
      'in' AS effect,
      'Ventas del día' AS title,
      NULL::text AS description,
      'sales_day' AS ref_type,
      sd.id AS ref_id,
      NULL::text AS kind,
      MAX(s.created_at) AS sort_time
    FROM sales s
    JOIN sales_days sd ON sd.id = s.sales_day_id
    GROUP BY sd.id, sd.sale_date, s.payment_method
    HAVING SUM(s.total) > 0

    UNION ALL

    -- Inversiones: Preparaciones (cash)
    SELECT
      ('prep-' || p.id || '-cash') AS id,
      TO_CHAR(p.prep_date, 'YYYY-MM-DD') AS date,
      'investment' AS type,
      'cash' AS account,
      p.paid_cash AS amount,
      'out' AS effect,
      ('Preparación · ' || f.name) AS title,
      p.description,
      'preparation' AS ref_type,
      p.id AS ref_id,
      NULL::text AS kind,
      p.created_at AS sort_time
    FROM preparations p
    JOIN flavors f ON f.id = p.flavor_id
    WHERE p.paid_cash > 0

    UNION ALL

    -- Inversiones: Preparaciones (yape)
    SELECT
      ('prep-' || p.id || '-yape') AS id,
      TO_CHAR(p.prep_date, 'YYYY-MM-DD') AS date,
      'investment' AS type,
      'yape' AS account,
      p.paid_yape AS amount,
      'out' AS effect,
      ('Preparación · ' || f.name) AS title,
      p.description,
      'preparation' AS ref_type,
      p.id AS ref_id,
      NULL::text AS kind,
      p.created_at AS sort_time
    FROM preparations p
    JOIN flavors f ON f.id = p.flavor_id
    WHERE p.paid_yape > 0

    UNION ALL

    -- Inversiones: Preparaciones (own)
    SELECT
      ('prep-' || p.id || '-own') AS id,
      TO_CHAR(p.prep_date, 'YYYY-MM-DD') AS date,
      'investment' AS type,
      'own' AS account,
      p.paid_own AS amount,
      'none' AS effect,
      ('Preparación · ' || f.name) AS title,
      p.description,
      'preparation' AS ref_type,
      p.id AS ref_id,
      NULL::text AS kind,
      p.created_at AS sort_time
    FROM preparations p
    JOIN flavors f ON f.id = p.flavor_id
    WHERE p.paid_own > 0

    UNION ALL

    -- Inversiones: Gastos (cash)
    SELECT
      ('exp-' || e.id || '-cash') AS id,
      TO_CHAR(e.expense_date, 'YYYY-MM-DD') AS date,
      'investment' AS type,
      'cash' AS account,
      e.paid_cash AS amount,
      'out' AS effect,
      ('Gasto · ' || m.name) AS title,
      e.description,
      'expense' AS ref_type,
      e.id AS ref_id,
      NULL::text AS kind,
      e.created_at AS sort_time
    FROM expenses e
    JOIN materials m ON m.id = e.material_id
    WHERE e.paid_cash > 0

    UNION ALL

    -- Inversiones: Gastos (yape)
    SELECT
      ('exp-' || e.id || '-yape') AS id,
      TO_CHAR(e.expense_date, 'YYYY-MM-DD') AS date,
      'investment' AS type,
      'yape' AS account,
      e.paid_yape AS amount,
      'out' AS effect,
      ('Gasto · ' || m.name) AS title,
      e.description,
      'expense' AS ref_type,
      e.id AS ref_id,
      NULL::text AS kind,
      e.created_at AS sort_time
    FROM expenses e
    JOIN materials m ON m.id = e.material_id
    WHERE e.paid_yape > 0

    UNION ALL

    -- Inversiones: Gastos (own)
    SELECT
      ('exp-' || e.id || '-own') AS id,
      TO_CHAR(e.expense_date, 'YYYY-MM-DD') AS date,
      'investment' AS type,
      'own' AS account,
      e.paid_own AS amount,
      'none' AS effect,
      ('Gasto · ' || m.name) AS title,
      e.description,
      'expense' AS ref_type,
      e.id AS ref_id,
      NULL::text AS kind,
      e.created_at AS sort_time
    FROM expenses e
    JOIN materials m ON m.id = e.material_id
    WHERE e.paid_own > 0

    UNION ALL

    -- Retiros: cash
    SELECT
      ('with-' || w.id || '-cash') AS id,
      TO_CHAR(w.withdrawal_date, 'YYYY-MM-DD') AS date,
      'withdrawal' AS type,
      'cash' AS account,
      w.cash_amount AS amount,
      'out' AS effect,
      CASE WHEN w.kind = 'profit' THEN 'Retiro de ganancias' ELSE 'Devolución de aporte' END AS title,
      w.description,
      'withdrawal' AS ref_type,
      w.id AS ref_id,
      w.kind,
      w.created_at AS sort_time
    FROM withdrawals w
    WHERE w.cash_amount > 0

    UNION ALL

    -- Retiros: yape
    SELECT
      ('with-' || w.id || '-yape') AS id,
      TO_CHAR(w.withdrawal_date, 'YYYY-MM-DD') AS date,
      'withdrawal' AS type,
      'yape' AS account,
      w.yape_amount AS amount,
      'out' AS effect,
      CASE WHEN w.kind = 'profit' THEN 'Retiro de ganancias' ELSE 'Devolución de aporte' END AS title,
      w.description,
      'withdrawal' AS ref_type,
      w.id AS ref_id,
      w.kind,
      w.created_at AS sort_time
    FROM withdrawals w
    WHERE w.yape_amount > 0
  )
`;

const toTransactionDto = (row) => ({
  id: row.id,
  date: row.date,
  type: row.type,
  account: row.account,
  amount: Number(row.amount),
  effect: row.effect,
  title: row.title,
  description: row.description || null,
  refType: row.ref_type,
  refId: Number(row.ref_id),
  kind: row.kind || null,
});

export const transactionsRepository = {
  async findPaginated({ page = 1, pageSize = 20, from, to, type, account } = {}) {
    const whereClauses = [];
    const params = [];

    if (from) {
      params.push(from);
      whereClauses.push(`date >= $${params.length}`);
    }

    if (to) {
      params.push(to);
      whereClauses.push(`date <= $${params.length}`);
    }

    if (type) {
      params.push(type);
      whereClauses.push(`type = $${params.length}`);
    }

    if (account) {
      params.push(account);
      whereClauses.push(`account = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `
      ${MOVEMENTS_CTE}
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(amount) FILTER (WHERE effect = 'in'), 0) AS total_in,
        COALESCE(SUM(amount) FILTER (WHERE effect = 'out'), 0) AS total_out
      FROM all_movements
      ${whereSql};
    `;

    const countRes = await query(countSql, params);
    const total = Number(countRes.rows[0]?.total || 0);
    const totalIn = Number(Number(countRes.rows[0]?.total_in || 0).toFixed(2));
    const totalOut = Number(Number(countRes.rows[0]?.total_out || 0).toFixed(2));

    const offset = (page - 1) * pageSize;
    params.push(pageSize);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const itemsSql = `
      ${MOVEMENTS_CTE}
      SELECT id, date, type, account, amount, effect, title, description, ref_type, ref_id, kind
      FROM all_movements
      ${whereSql}
      ORDER BY date DESC, sort_time DESC, id DESC
      LIMIT ${limitParam} OFFSET ${offsetParam};
    `;

    const itemsRes = await query(itemsSql, params);
    const items = itemsRes.rows.map(toTransactionDto);

    return {
      items,
      total,
      totalIn,
      totalOut,
    };
  },
};
