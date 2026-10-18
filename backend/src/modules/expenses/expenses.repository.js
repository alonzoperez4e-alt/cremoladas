import { query } from '../../db/pool.js';

const toExpenseDto = (row) => {
  if (!row) return null;

  let expenseDateStr = '';
  if (row.expense_date instanceof Date) {
    const year = row.expense_date.getFullYear();
    const month = String(row.expense_date.getMonth() + 1).padStart(2, '0');
    const day = String(row.expense_date.getDate()).padStart(2, '0');
    expenseDateStr = `${year}-${month}-${day}`;
  } else if (typeof row.expense_date === 'string') {
    expenseDateStr = row.expense_date.slice(0, 10);
  }

  return {
    id: Number(row.id),
    materialId: Number(row.material_id),
    materialName: row.material_name || null,
    expenseDate: expenseDateStr,
    amount: Number(row.amount),
    description: row.description || null,
    createdBy: row.created_by ? Number(row.created_by) : null,
    createdAt: row.created_at,
    payment: {
      cashAmount: Number(row.paid_cash || 0),
      yapeAmount: Number(row.paid_yape || 0),
      ownAmount: Number(row.paid_own || 0),
    },
  };
};

export const expensesRepository = {
  async findPaginated({ page = 1, pageSize = 20, from, to, materialId } = {}) {
    const whereClauses = [];
    const params = [];

    if (from) {
      params.push(from);
      whereClauses.push(`e.expense_date >= $${params.length}`);
    }

    if (to) {
      params.push(to);
      whereClauses.push(`e.expense_date <= $${params.length}`);
    }

    if (materialId) {
      params.push(materialId);
      whereClauses.push(`e.material_id = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Consulta de conteo y suma total sobre todo el conjunto filtrado
    const aggSql = `
      SELECT COUNT(*)::int AS total, COALESCE(SUM(e.amount), 0) AS total_amount
      FROM expenses e
      ${whereSql};
    `;
    const aggRes = await query(aggSql, params);
    const total = Number(aggRes.rows[0]?.total || 0);
    const totalAmount = Number(aggRes.rows[0]?.total_amount || 0);

    // Consulta de página con orden e información del material
    const offset = (page - 1) * pageSize;
    params.push(pageSize);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const itemsSql = `
      SELECT e.id, e.material_id, e.expense_date, e.amount, e.description, e.created_by, e.created_at,
             e.paid_cash, e.paid_yape, e.paid_own,
             m.name AS material_name
      FROM expenses e
      JOIN materials m ON m.id = e.material_id
      ${whereSql}
      ORDER BY e.expense_date DESC, e.id DESC
      LIMIT ${limitParam} OFFSET ${offsetParam};
    `;

    const itemsRes = await query(itemsSql, params);
    const items = itemsRes.rows.map(toExpenseDto);

    return {
      items,
      total,
      totalAmount,
    };
  },

  async findById(id, client = null) {
    const sql = `
      SELECT e.id, e.material_id, e.expense_date, e.amount, e.description, e.created_by, e.created_at,
             e.paid_cash, e.paid_yape, e.paid_own,
             m.name AS material_name
      FROM expenses e
      JOIN materials m ON m.id = e.material_id
      WHERE e.id = $1
      LIMIT 1;
    `;
    const res = client ? await client.query(sql, [id]) : await query(sql, [id]);
    return toExpenseDto(res.rows[0]);
  },

  async create({ materialId, expenseDate, amount, description, createdBy, paidCash = 0, paidYape = 0, paidOwn = 0 }, client = null) {
    const sql = `
      WITH inserted AS (
        INSERT INTO expenses (material_id, expense_date, amount, description, created_by, paid_cash, paid_yape, paid_own, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id, material_id, expense_date, amount, description, created_by, paid_cash, paid_yape, paid_own, created_at
      )
      SELECT ins.id, ins.material_id, ins.expense_date, ins.amount, ins.description, ins.created_by,
             ins.paid_cash, ins.paid_yape, ins.paid_own,
             m.name AS material_name
      FROM inserted ins
      JOIN materials m ON m.id = ins.material_id;
    `;
    const res = client
      ? await client.query(sql, [materialId, expenseDate, amount, description, createdBy, paidCash, paidYape, paidOwn])
      : await query(sql, [materialId, expenseDate, amount, description, createdBy, paidCash, paidYape, paidOwn]);
    return toExpenseDto(res.rows[0]);
  },

  async update(id, { materialId, expenseDate, amount, description, paidCash = 0, paidYape = 0, paidOwn = 0 }, client = null) {
    const sql = `
      WITH updated AS (
        UPDATE expenses
        SET material_id = $1, expense_date = $2, amount = $3, description = $4,
            paid_cash = $5, paid_yape = $6, paid_own = $7
        WHERE id = $8
        RETURNING id, material_id, expense_date, amount, description, created_by, paid_cash, paid_yape, paid_own, created_at
      )
      SELECT upd.id, upd.material_id, upd.expense_date, upd.amount, upd.description, upd.created_by,
             upd.paid_cash, upd.paid_yape, upd.paid_own,
             m.name AS material_name
      FROM updated upd
      JOIN materials m ON m.id = upd.material_id;
    `;
    const res = client
      ? await client.query(sql, [materialId, expenseDate, amount, description, paidCash, paidYape, paidOwn, id])
      : await query(sql, [materialId, expenseDate, amount, description, paidCash, paidYape, paidOwn, id]);
    return toExpenseDto(res.rows[0]);
  },

  async delete(id, client = null) {
    const sql = 'DELETE FROM expenses WHERE id = $1 RETURNING id;';
    const res = client ? await client.query(sql, [id]) : await query(sql, [id]);
    return res.rowCount > 0;
  },
};
