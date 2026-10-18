import { query } from '../../db/pool.js';

const toMaterialDto = (row) => {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
};

export const materialsRepository = {
  async findAllActive() {
    const sql = `
      SELECT id, name, is_active, created_at
      FROM materials
      WHERE is_active = true
      ORDER BY name ASC;
    `;
    const res = await query(sql);
    return res.rows.map(toMaterialDto);
  },

  async findById(id) {
    const sql = `
      SELECT id, name, is_active, created_at
      FROM materials
      WHERE id = $1 AND is_active = true
      LIMIT 1;
    `;
    const res = await query(sql, [id]);
    return toMaterialDto(res.rows[0]);
  },

  async findActiveByName(name, excludeId = null) {
    let sql = `
      SELECT id, name, is_active, created_at
      FROM materials
      WHERE LOWER(name) = LOWER($1) AND is_active = true
    `;
    const params = [name];

    if (excludeId !== null) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }

    sql += ' LIMIT 1;';
    const res = await query(sql, params);
    return toMaterialDto(res.rows[0]);
  },

  async create(name) {
    const sql = `
      INSERT INTO materials (name, is_active, created_at)
      VALUES ($1, true, NOW())
      RETURNING id, name, is_active, created_at;
    `;
    const res = await query(sql, [name]);
    return toMaterialDto(res.rows[0]);
  },

  async update(id, name) {
    const sql = `
      UPDATE materials
      SET name = $1
      WHERE id = $2 AND is_active = true
      RETURNING id, name, is_active, created_at;
    `;
    const res = await query(sql, [name, id]);
    return toMaterialDto(res.rows[0]);
  },

  async softDelete(id) {
    const sql = `
      UPDATE materials
      SET is_active = false
      WHERE id = $1 AND is_active = true
      RETURNING id;
    `;
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  },
};
