import { preparationsService } from './preparations.service.js';

export const preparationsController = {
  async getAll(req, res) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const { from, to, flavorId } = req.query;

    const result = await preparationsService.getPaginated({
      page,
      pageSize,
      from,
      to,
      flavorId: flavorId ? Number(flavorId) : undefined,
    });

    return res.status(200).json({
      data: result.items,
      pagination: result.pagination,
      summary: result.summary,
    });
  },

  async create(req, res) {
    const created = await preparationsService.create(req.body, req.user.id);
    return res.status(201).json({ data: created });
  },

  async update(req, res) {
    const updated = await preparationsService.update(req.params.id, req.body);
    return res.status(200).json({ data: updated });
  },

  async delete(req, res) {
    const result = await preparationsService.delete(req.params.id);
    return res.status(200).json({ data: result });
  },
};
