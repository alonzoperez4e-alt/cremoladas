import { query } from '../../db/pool.js';

const toFlavorDto = (row) => {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name,
    color: row.color,
    icon: row.icon,
    isSoldOut: Boolean(row.is_sold_out),
    isActive: Boolean(row.is_active),
  };
};

export const flavorsRepository = {
  async findAll({ availableOnly = false } = {}) {
    let sql = `
      SELECT id, name, color, icon, is_sold_out, is_active
      FROM flavors
      WHERE is_active = true
    `;
    const params = [];

    if (availableOnly) {
      sql += ' AND is_sold_out = false';
    }

    sql += ' ORDER BY name ASC;';

    const res = await query(sql, params);
    return res.rows.map(toFlavorDto);
  },

  async findById(id) {
    const sql = `
      SELECT id, name, color, icon, is_sold_out, is_active
      FROM flavors
      WHERE id = $1 AND is_active = true
      LIMIT 1;
    `;
    const res = await query(sql, [id]);
    return toFlavorDto(res.rows[0]);
  },

  async findActiveByName(name, excludeId = null) {
    let sql = `
      SELECT id, name, color, icon, is_sold_out, is_active
      FROM flavors
      WHERE LOWER(name) = LOWER($1) AND is_active = true
    `;
    const params = [name];

    if (excludeId !== null) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }

    sql += ' LIMIT 1;';
    const res = await query(sql, params);
    return toFlavorDto(res.rows[0]);
  },

  async create({ name, color, icon }) {
    const sql = `
      INSERT INTO flavors (name, color, icon, is_sold_out, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, false, true, NOW(), NOW())
      RETURNING id, name, color, icon, is_sold_out, is_active;
    `;
    const res = await query(sql, [name, color, icon]);
    return toFlavorDto(res.rows[0]);
  },

  async update(id, { name, color, icon }) {
    const sql = `
      UPDATE flavors
      SET name = $1, color = $2, icon = $3, updated_at = NOW()
      WHERE id = $4 AND is_active = true
      RETURNING id, name, color, icon, is_sold_out, is_active;
    `;
    const res = await query(sql, [name, color, icon, id]);
    return toFlavorDto(res.rows[0]);
  },

  async updateSoldOut(id, isSoldOut) {
    const sql = `
      UPDATE flavors
      SET is_sold_out = $1, updated_at = NOW()
      WHERE id = $2 AND is_active = true
      RETURNING id, name, color, icon, is_sold_out, is_active;
    `;
    const res = await query(sql, [isSoldOut, id]);
    return toFlavorDto(res.rows[0]);
  },

  async softDelete(id) {
    const sql = `
      UPDATE flavors
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND is_active = true
      RETURNING id;
    `;
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  },
};
