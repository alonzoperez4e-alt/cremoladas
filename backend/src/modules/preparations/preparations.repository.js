import { query } from '../../db/pool.js';

const toPreparationDto = (row) => {
  if (!row) return null;

  let prepDateStr = '';
  if (row.prep_date instanceof Date) {
    const year = row.prep_date.getFullYear();
    const month = String(row.prep_date.getMonth() + 1).padStart(2, '0');
    const day = String(row.prep_date.getDate()).padStart(2, '0');
    prepDateStr = `${year}-${month}-${day}`;
  } else if (typeof row.prep_date === 'string') {
    prepDateStr = row.prep_date.slice(0, 10);
  }

  return {
    id: Number(row.id),
    flavorId: Number(row.flavor_id),
    flavorName: row.flavor_name || null,
    flavorColor: row.flavor_color || null,
    flavorIcon: row.flavor_icon || null,
    prepDate: prepDateStr,
    investmentAmount: Number(row.investment_amount),
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

export const preparationsRepository = {
  async findPaginated({ page = 1, pageSize = 20, from, to, flavorId } = {}) {
    const whereClauses = [];
    const params = [];

    if (from) {
      params.push(from);
      whereClauses.push(`p.prep_date >= $${params.length}`);
    }

    if (to) {
      params.push(to);
      whereClauses.push(`p.prep_date <= $${params.length}`);
    }

    if (flavorId) {
      params.push(flavorId);
      whereClauses.push(`p.flavor_id = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const aggSql = `
      SELECT COUNT(*)::int AS total, COALESCE(SUM(p.investment_amount), 0) AS total_amount
      FROM preparations p
      ${whereSql};
    `;
    const aggRes = await query(aggSql, params);
    const total = Number(aggRes.rows[0]?.total || 0);
    const totalAmount = Number(aggRes.rows[0]?.total_amount || 0);

    const offset = (page - 1) * pageSize;
    params.push(pageSize);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const itemsSql = `
      SELECT p.id, p.flavor_id, p.prep_date, p.investment_amount, p.description, p.created_by, p.created_at,
             p.paid_cash, p.paid_yape, p.paid_own,
             f.name AS flavor_name, f.color AS flavor_color, f.icon AS flavor_icon
      FROM preparations p
      JOIN flavors f ON f.id = p.flavor_id
      ${whereSql}
      ORDER BY p.prep_date DESC, p.id DESC
      LIMIT ${limitParam} OFFSET ${offsetParam};
    `;

    const itemsRes = await query(itemsSql, params);
    const items = itemsRes.rows.map(toPreparationDto);

    return {
      items,
      total,
      totalAmount,
    };
  },

  async findById(id, client = null) {
    const sql = `
      SELECT p.id, p.flavor_id, p.prep_date, p.investment_amount, p.description, p.created_by, p.created_at,
             p.paid_cash, p.paid_yape, p.paid_own,
             f.name AS flavor_name, f.color AS flavor_color, f.icon AS flavor_icon
      FROM preparations p
      JOIN flavors f ON f.id = p.flavor_id
      WHERE p.id = $1
      LIMIT 1;
    `;
    const res = client ? await client.query(sql, [id]) : await query(sql, [id]);
    return toPreparationDto(res.rows[0]);
  },

  async create({ flavorId, prepDate, investmentAmount, description, createdBy, paidCash = 0, paidYape = 0, paidOwn = 0 }, client = null) {
    const sql = `
      WITH inserted AS (
        INSERT INTO preparations (flavor_id, prep_date, investment_amount, description, created_by, paid_cash, paid_yape, paid_own, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id, flavor_id, prep_date, investment_amount, description, created_by, paid_cash, paid_yape, paid_own, created_at
      )
      SELECT ins.id, ins.flavor_id, ins.prep_date, ins.investment_amount, ins.description, ins.created_by,
             ins.paid_cash, ins.paid_yape, ins.paid_own,
             f.name AS flavor_name, f.color AS flavor_color, f.icon AS flavor_icon, ins.created_at
      FROM inserted ins
      JOIN flavors f ON f.id = ins.flavor_id;
    `;
    const res = client
      ? await client.query(sql, [flavorId, prepDate, investmentAmount, description, createdBy, paidCash, paidYape, paidOwn])
      : await query(sql, [flavorId, prepDate, investmentAmount, description, createdBy, paidCash, paidYape, paidOwn]);
    return toPreparationDto(res.rows[0]);
  },

  async update(id, { flavorId, prepDate, investmentAmount, description, paidCash = 0, paidYape = 0, paidOwn = 0 }, client = null) {
    const sql = `
      WITH updated AS (
        UPDATE preparations
        SET flavor_id = $1, prep_date = $2, investment_amount = $3, description = $4,
            paid_cash = $5, paid_yape = $6, paid_own = $7
        WHERE id = $8
        RETURNING id, flavor_id, prep_date, investment_amount, description, created_by, paid_cash, paid_yape, paid_own, created_at
      )
      SELECT upd.id, upd.flavor_id, upd.prep_date, upd.investment_amount, upd.description, upd.created_by,
             upd.paid_cash, upd.paid_yape, upd.paid_own,
             f.name AS flavor_name, f.color AS flavor_color, f.icon AS flavor_icon, upd.created_at
      FROM updated upd
      JOIN flavors f ON f.id = upd.flavor_id;
    `;
    const res = client
      ? await client.query(sql, [flavorId, prepDate, investmentAmount, description, paidCash, paidYape, paidOwn, id])
      : await query(sql, [flavorId, prepDate, investmentAmount, description, paidCash, paidYape, paidOwn, id]);
    return toPreparationDto(res.rows[0]);
  },

  async delete(id, client = null) {
    const sql = 'DELETE FROM preparations WHERE id = $1 RETURNING id;';
    const res = client ? await client.query(sql, [id]) : await query(sql, [id]);
    return res.rowCount > 0;
  },
};
