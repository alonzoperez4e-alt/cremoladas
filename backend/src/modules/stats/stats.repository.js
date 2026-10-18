import { query } from '../../db/pool.js';

export const statsRepository = {
  async getBusinessSummary() {
    const prepSql = `SELECT COALESCE(SUM(investment_amount), 0) AS total_prep FROM preparations;`;
    const expSql = `SELECT COALESCE(SUM(amount), 0) AS total_exp FROM expenses;`;
    const balancesSql = `SELECT * FROM v_account_balances LIMIT 1;`;

    const [prepRes, expRes, balancesRes] = await Promise.all([
      query(prepSql),
      query(expSql),
      query(balancesSql),
    ]);

    const preparations = Number(prepRes.rows[0]?.total_prep || 0);
    const expenses = Number(expRes.rows[0]?.total_exp || 0);

    const b = balancesRes.rows[0] || {};
    const cashRevenue = Number(b.cash_revenue || 0);
    const yapeRevenue = Number(b.yape_revenue || 0);
    const cashInvested = Number(b.cash_invested || 0);
    const yapeInvested = Number(b.yape_invested || 0);
    const ownInvested = Number(b.own_invested || 0);
    const cashWithdrawn = Number(b.cash_withdrawn || 0);
    const yapeWithdrawn = Number(b.yape_withdrawn || 0);
    const profitWithdrawn = Number(b.profit_withdrawn || 0);
    const reimbursed = Number(b.reimbursed || 0);
    const cashBalance = Number(b.cash_balance || 0);
    const yapeBalance = Number(b.yape_balance || 0);
    const pendingReimbursement = Number(b.pending_reimbursement || 0);

    const totalRevenue = Number((cashRevenue + yapeRevenue).toFixed(2));
    const totalInvestment = Number((preparations + expenses).toFixed(2));
    const netProfit = Number((totalRevenue - totalInvestment).toFixed(2));
    const availableProfit = Number((netProfit - profitWithdrawn).toFixed(2));

    const totalWithdrawn = Number((cashWithdrawn + yapeWithdrawn).toFixed(2));
    const totalBalance = Number((cashBalance + yapeBalance).toFixed(2));

    return {
      totalInvestment,
      totalRevenue,
      netProfit,
      investmentBreakdown: {
        preparations,
        expenses,
      },
      revenueByPaymentMethod: {
        cash: cashRevenue,
        yape: yapeRevenue,
      },
      investmentBySource: {
        cash: cashInvested,
        yape: yapeInvested,
        own: ownInvested,
      },
      withdrawals: {
        total: totalWithdrawn,
        profit: profitWithdrawn,
        reimbursement: reimbursed,
      },
      balances: {
        cash: cashBalance,
        yape: yapeBalance,
        total: totalBalance,
      },
      availableProfit,
      pendingReimbursement,
    };
  },
};
