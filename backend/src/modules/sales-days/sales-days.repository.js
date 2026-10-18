import { query } from '../../db/pool.js';

const toSalesDayDto = (row) => {
  if (!row) return null;
  return {
    id: Number(row.id),
    status: row.status,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    closedBy: row.closed_by,
  };
};

const toSummaryRowDto = (row) => {
  if (!row) return null;

  let saleDateStr = '';
  if (row.sale_date instanceof Date) {
    const year = row.sale_date.getFullYear();
    const month = String(row.sale_date.getMonth() + 1).padStart(2, '0');
    const day = String(row.sale_date.getDate()).padStart(2, '0');
    saleDateStr = `${year}-${month}-${day}`;
  } else if (typeof row.sale_date === 'string') {
    saleDateStr = row.sale_date.slice(0, 10);
  }

  return {
    id: Number(row.sales_day_id || row.id),
    saleDate: saleDateStr,
    status: row.status,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    closedBy: row.closed_by,
    salesCount: Number(row.sales_count || 0),
    cupsSold: Number(row.cups_sold || 0),
    totalSold: Number(row.total_sold || 0),
    cashTotal: Number(row.cash_total || 0),
    yapeTotal: Number(row.yape_total || 0),
  };
};

export const salesDaysRepository = {
  async findByDate(dateStr) {
    const sql = `
      SELECT id, sale_date, status, opened_at, opened_by, closed_at, closed_by
      FROM sales_days
      WHERE sale_date = $1
      LIMIT 1;
    `;
    const res = await query(sql, [dateStr]);
    return res.rows[0] ? toSalesDayDto(res.rows[0]) : null;
  },

  async getTotalsByDayId(dayId) {
    const salesSql = `
      SELECT
        COUNT(id)::int AS sales_count,
        COALESCE(SUM(total), 0) AS total_sold,
        COALESCE(SUM(total) FILTER (WHERE payment_method = 'cash'), 0) AS cash_total,
        COALESCE(SUM(total) FILTER (WHERE payment_method = 'yape'), 0) AS yape_total
      FROM sales
      WHERE sales_day_id = $1;
    `;
    const cupsSql = `
      SELECT COALESCE(SUM(si.quantity), 0)::int AS cups_sold
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE s.sales_day_id = $1;
    `;
    const [salesRes, cupsRes] = await Promise.all([
      query(salesSql, [dayId]),
      query(cupsSql, [dayId]),
    ]);

    const salesRow = salesRes.rows[0];
    const cupsRow = cupsRes.rows[0];

    return {
      salesCount: Number(salesRow?.sales_count || 0),
      cupsSold: Number(cupsRow?.cups_sold || 0),
      totalSold: Number(salesRow?.total_sold || 0),
      byPaymentMethod: {
        cash: Number(salesRow?.cash_total || 0),
        yape: Number(salesRow?.yape_total || 0),
      },
    };
  },

  async create(dateStr, userId) {
    const sql = `
      INSERT INTO sales_days (sale_date, status, opened_at, opened_by)
      VALUES ($1, 'open', NOW(), $2)
      RETURNING id, sale_date, status, opened_at, closed_at, closed_by;
    `;
    const res = await query(sql, [dateStr, userId]);
    return toSalesDayDto(res.rows[0]);
  },

  async closeDay(dayId) {
    const sql = `
      UPDATE sales_days
      SET status = 'closed', closed_at = NOW(), closed_by = 'manual'
      WHERE id = $1
      RETURNING id, sale_date, status, opened_at, closed_at, closed_by;
    `;
    const res = await query(sql, [dayId]);
    return toSalesDayDto(res.rows[0]);
  },

  async getDaySales(dayId) {
    // 1. Obtener todas las ventas del día
    const salesSql = `
      SELECT id, total, payment_method, created_at
      FROM sales
      WHERE sales_day_id = $1
      ORDER BY created_at DESC, id DESC;
    `;
    const salesRes = await query(salesSql, [dayId]);
    const sales = salesRes.rows;

    if (sales.length === 0) {
      return [];
    }

    const saleIds = sales.map((s) => s.id);

    // 2. Obtener todos los items de esas ventas junto con sus sabores asociados
    const itemsSql = `
      SELECT si.id, si.sale_id, si.quantity, si.unit_price, si.subtotal,
             f.id AS flavor_id, f.name AS flavor_name, f.color AS flavor_color, f.icon AS flavor_icon
      FROM sale_items si
      JOIN sale_item_flavors sif ON sif.sale_item_id = si.id
      JOIN flavors f ON f.id = sif.flavor_id
      WHERE si.sale_id = ANY($1)
      ORDER BY si.id ASC, f.name ASC;
    `;
    const itemsRes = await query(itemsSql, [saleIds]);

    // Agrupar items por sale_id y sabores por sale_item_id
    const itemsMap = new Map(); // saleItemId -> item object con array de flavors
    const salesItemsMap = new Map(); // saleId -> array de items

    for (const row of itemsRes.rows) {
      if (!itemsMap.has(row.id)) {
        const itemObj = {
          id: Number(row.id),
          quantity: Number(row.quantity),
          unitPrice: Number(row.unit_price),
          subtotal: Number(row.subtotal),
          flavors: [],
        };
        itemsMap.set(row.id, itemObj);

        if (!salesItemsMap.has(row.sale_id)) {
          salesItemsMap.set(row.sale_id, []);
        }
        salesItemsMap.get(row.sale_id).push(itemObj);
      }

      itemsMap.get(row.id).flavors.push({
        id: Number(row.flavor_id),
        name: row.flavor_name,
        color: row.flavor_color,
        icon: row.flavor_icon,
      });
    }

    return sales.map((s) => ({
      id: Number(s.id),
      total: Number(s.total),
      paymentMethod: s.payment_method,
      createdAt: s.created_at,
      items: salesItemsMap.get(s.id) || [],
    }));
  },

  async getDayFlavorStats(dayId) {
    const sql = `
      SELECT flavor_id, flavor_name, color, icon, cups, attributed_revenue
      FROM v_sales_day_by_flavor
      WHERE sales_day_id = $1
      ORDER BY cups DESC, flavor_name ASC;
    `;
    const res = await query(sql, [dayId]);
    return res.rows.map((row) => ({
      flavorId: Number(row.flavor_id),
      flavorName: row.flavor_name,
      color: row.color,
      icon: row.icon,
      cups: Number(row.cups || 0),
      attributedRevenue: Number(row.attributed_revenue || 0),
    }));
  },

  async findPaginatedHistory({ page = 1, pageSize = 20, from, to } = {}) {
    const whereClauses = [];
    const params = [];

    if (from) {
      params.push(from);
      whereClauses.push(`sd.sale_date >= $${params.length}`);
    }

    if (to) {
      params.push(to);
      whereClauses.push(`sd.sale_date <= $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int AS total FROM sales_days sd ${whereSql};`;
    const countRes = await query(countSql, params);
    const total = Number(countRes.rows[0]?.total || 0);

    const offset = (page - 1) * pageSize;
    params.push(pageSize);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const sql = `
      SELECT
        sd.id,
        sd.sale_date,
        sd.status,
        sd.opened_at,
        sd.closed_at,
        sd.closed_by,
        COALESCE(s_agg.sales_count, 0) AS sales_count,
        COALESCE(si_agg.cups_sold, 0) AS cups_sold,
        COALESCE(s_agg.total_sold, 0) AS total_sold,
        COALESCE(s_agg.cash_total, 0) AS cash_total,
        COALESCE(s_agg.yape_total, 0) AS yape_total
      FROM sales_days sd
      LEFT JOIN (
        SELECT
          sales_day_id,
          COUNT(id)::int AS sales_count,
          COALESCE(SUM(total), 0) AS total_sold,
          COALESCE(SUM(total) FILTER (WHERE payment_method = 'cash'), 0) AS cash_total,
          COALESCE(SUM(total) FILTER (WHERE payment_method = 'yape'), 0) AS yape_total
        FROM sales
        GROUP BY sales_day_id
      ) s_agg ON s_agg.sales_day_id = sd.id
      LEFT JOIN (
        SELECT
          s.sales_day_id,
          COALESCE(SUM(si.quantity), 0)::int AS cups_sold
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        GROUP BY s.sales_day_id
      ) si_agg ON si_agg.sales_day_id = sd.id
      ${whereSql}
      ORDER BY sd.sale_date DESC
      LIMIT ${limitParam} OFFSET ${offsetParam};
    `;
    const res = await query(sql, params);
    const items = res.rows.map(toSummaryRowDto);

    return {
      items,
      total,
    };
  },
};
