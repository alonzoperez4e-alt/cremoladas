import { expensesService } from './expenses.service.js';

export const expensesController = {
  async getAll(req, res) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const { from, to, materialId } = req.query;

    const result = await expensesService.getPaginated({
      page,
      pageSize,
      from,
      to,
      materialId: materialId ? Number(materialId) : undefined,
    });

    return res.status(200).json({
      data: result.items,
      pagination: result.pagination,
      summary: result.summary,
    });
  },

  async create(req, res) {
    const created = await expensesService.create(req.body, req.user.id);
    return res.status(201).json({ data: created });
  },

  async update(req, res) {
    const updated = await expensesService.update(req.params.id, req.body);
    return res.status(200).json({ data: updated });
  },

  async delete(req, res) {
    const result = await expensesService.delete(req.params.id);
    return res.status(200).json({ data: result });
  },
};
