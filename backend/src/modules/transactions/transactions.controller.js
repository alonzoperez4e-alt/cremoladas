import { transactionsService } from './transactions.service.js';

export const transactionsController = {
  async getAll(req, res) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const { from, to, type, account } = req.query;

    const result = await transactionsService.getPaginated({
      page,
      pageSize,
      from,
      to,
      type,
      account,
    });

    return res.status(200).json({
      data: result.items,
      pagination: result.pagination,
      summary: result.summary,
    });
  },
};
