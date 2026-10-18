export const salesRepository = {
  async getCupPrice(client) {
    const sql = `SELECT value FROM app_settings WHERE key = 'cup_price' LIMIT 1;`;
    const res = await client.query(sql);
    const rawVal = res.rows[0]?.value;
    return rawVal ? Number(rawVal) : 2.0;
  },

  async lockSalesDayByDate(client, dateStr) {
    const sql = `
      SELECT id, status
      FROM sales_days
      WHERE sale_date = $1
      FOR SHARE;
    `;
    const res = await client.query(sql, [dateStr]);
    return res.rows[0] || null;
  },

  async lockFlavorsByIds(client, ids) {
    const sql = `
      SELECT id, name, color, icon, is_sold_out, is_active
      FROM flavors
      WHERE id = ANY($1)
      FOR SHARE;
    `;
    const res = await client.query(sql, [ids]);
    return res.rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      color: row.color,
      icon: row.icon,
      isSoldOut: Boolean(row.is_sold_out),
      isActive: Boolean(row.is_active),
    }));
  },

  async createSaleRecord(client, { salesDayId, createdBy, paymentMethod }) {
    const sql = `
      INSERT INTO sales (sales_day_id, created_by, payment_method, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, total, payment_method, created_at;
    `;
    const res = await client.query(sql, [salesDayId, createdBy, paymentMethod]);
    return {
      id: Number(res.rows[0].id),
      total: Number(res.rows[0].total || 0),
      paymentMethod: res.rows[0].payment_method,
      createdAt: res.rows[0].created_at,
    };
  },

  async createSaleItem(client, { saleId, quantity, unitPrice }) {
    const sql = `
      INSERT INTO sale_items (sale_id, quantity, unit_price)
      VALUES ($1, $2, $3)
      RETURNING id, quantity, unit_price, subtotal;
    `;
    const res = await client.query(sql, [saleId, quantity, unitPrice]);
    return {
      id: Number(res.rows[0].id),
      quantity: Number(res.rows[0].quantity),
      unitPrice: Number(res.rows[0].unit_price),
      subtotal: Number(res.rows[0].subtotal),
    };
  },

  async createSaleItemFlavor(client, { saleItemId, flavorId }) {
    const sql = `
      INSERT INTO sale_item_flavors (sale_item_id, flavor_id)
      VALUES ($1, $2);
    `;
    await client.query(sql, [saleItemId, flavorId]);
  },

  async getSaleWithDetails(client, saleId) {
    const saleSql = `SELECT id, total, payment_method, created_at FROM sales WHERE id = $1;`;
    const saleRes = await client.query(saleSql, [saleId]);
    const sale = saleRes.rows[0];

    const itemsSql = `
      SELECT si.id, si.quantity, si.unit_price, si.subtotal,
             f.id AS flavor_id, f.name AS flavor_name, f.color AS flavor_color, f.icon AS flavor_icon
      FROM sale_items si
      JOIN sale_item_flavors sif ON sif.sale_item_id = si.id
      JOIN flavors f ON f.id = sif.flavor_id
      WHERE si.sale_id = $1
      ORDER BY si.id ASC, f.name ASC;
    `;
    const itemsRes = await client.query(itemsSql, [saleId]);

    const itemsMap = new Map();
    for (const row of itemsRes.rows) {
      if (!itemsMap.has(row.id)) {
        itemsMap.set(row.id, {
          id: Number(row.id),
          quantity: Number(row.quantity),
          unitPrice: Number(row.unit_price),
          subtotal: Number(row.subtotal),
          flavors: [],
        });
      }
      itemsMap.get(row.id).flavors.push({
        id: Number(row.flavor_id),
        name: row.flavor_name,
        color: row.flavor_color,
        icon: row.flavor_icon,
      });
    }

    return {
      id: Number(sale.id),
      total: Number(sale.total),
      paymentMethod: sale.payment_method,
      createdAt: sale.created_at,
      items: Array.from(itemsMap.values()),
    };
  },
};
