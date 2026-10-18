import { salesDaysService } from './sales-days.service.js';

export const salesDaysController = {
  async getToday(req, res) {
    const data = await salesDaysService.getTodayStatus();
    return res.status(200).json({ data });
  },

  async startToday(req, res) {
    const data = await salesDaysService.startTodayDay(req.user.id);
    return res.status(201).json({ data });
  },

  async closeToday(req, res) {
    const data = await salesDaysService.closeTodayDay();
    return res.status(200).json({ data });
  },

  async getTodaySales(req, res) {
    const data = await salesDaysService.getTodaySales();
    return res.status(200).json({ data });
  },

  async getHistory(req, res) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const { from, to } = req.query;

    const result = await salesDaysService.getHistory({
      page,
      pageSize,
      from,
      to,
    });

    return res.status(200).json({
      data: result.items,
      pagination: result.pagination,
    });
  },
};
