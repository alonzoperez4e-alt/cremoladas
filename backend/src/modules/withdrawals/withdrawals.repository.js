import { query } from '../../db/pool.js';

const toWithdrawalDto = (row) => {
  if (!row) return null;

  let withdrawalDateStr = '';
  if (row.withdrawal_date instanceof Date) {
    const year = row.withdrawal_date.getFullYear();
    const month = String(row.withdrawal_date.getMonth() + 1).padStart(2, '0');
    const day = String(row.withdrawal_date.getDate()).padStart(2, '0');
    withdrawalDateStr = `${year}-${month}-${day}`;
  } else if (typeof row.withdrawal_date === 'string') {
    withdrawalDateStr = row.withdrawal_date.slice(0, 10);
  }

  const cashAmount = Number(row.cash_amount);
  const yapeAmount = Number(row.yape_amount);

  return {
    id: Number(row.id),
    kind: row.kind,
    cashAmount,
    yapeAmount,
    total: Math.round((cashAmount + yapeAmount) * 100) / 100,
    withdrawalDate: withdrawalDateStr,
    description: row.description || null,
    createdBy: row.created_by ? Number(row.created_by) : null,
    createdAt: row.created_at,
  };
};

export const withdrawalsRepository = {
  async findById(id, client = null) {
    const sql = `
      SELECT id, withdrawal_date, kind, cash_amount, yape_amount, description, created_by, created_at
      FROM withdrawals
      WHERE id = $1
      LIMIT 1;
    `;
    const res = client ? await client.query(sql, [id]) : await query(sql, [id]);
    return toWithdrawalDto(res.rows[0]);
  },

  async create({ kind, cashAmount, yapeAmount, withdrawalDate, description, createdBy }, client = null) {
    const sql = `
      INSERT INTO withdrawals (kind, cash_amount, yape_amount, withdrawal_date, description, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, withdrawal_date, kind, cash_amount, yape_amount, description, created_by, created_at;
    `;
    const res = client
      ? await client.query(sql, [kind, cashAmount, yapeAmount, withdrawalDate, description, createdBy])
      : await query(sql, [kind, cashAmount, yapeAmount, withdrawalDate, description, createdBy]);
    return toWithdrawalDto(res.rows[0]);
  },

  async delete(id, client = null) {
    const sql = 'DELETE FROM withdrawals WHERE id = $1 RETURNING id;';
    const res = client ? await client.query(sql, [id]) : await query(sql, [id]);
    return res.rowCount > 0;
  },
};
