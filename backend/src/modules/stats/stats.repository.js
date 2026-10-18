import { query } from '../../db/pool.js';

export const statsRepository = {
  async getBusinessSummary() {
    const prepSql = `SELECT COALESCE(SUM(investment_amount), 0) AS total_prep FROM preparations;`;
    const expSql = `SELECT COALESCE(SUM(amount), 0) AS total_exp FROM expenses;`;
    const revSql = `
      SELECT
        COALESCE(SUM(total), 0) AS total_rev,
        COALESCE(SUM(total) FILTER (WHERE payment_method = 'cash'), 0) AS cash_rev,
        COALESCE(SUM(total) FILTER (WHERE payment_method = 'yape'), 0) AS yape_rev
      FROM sales;
    `;

    const [prepRes, expRes, revRes] = await Promise.all([
      query(prepSql),
      query(expSql),
      query(revSql),
    ]);

    const preparations = Number(prepRes.rows[0]?.total_prep || 0);
    const expenses = Number(expRes.rows[0]?.total_exp || 0);
    const totalRevenue = Number(revRes.rows[0]?.total_rev || 0);
    const cash = Number(revRes.rows[0]?.cash_rev || 0);
    const yape = Number(revRes.rows[0]?.yape_rev || 0);

    const totalInvestment = Number((preparations + expenses).toFixed(2));
    const netProfit = Number((totalRevenue - totalInvestment).toFixed(2));

    return {
      totalInvestment,
      totalRevenue,
      netProfit,
      investmentBreakdown: {
        preparations,
        expenses,
      },
      revenueByPaymentMethod: {
        cash,
        yape,
      },
    };
  },
};
