import { withdrawalsService } from './withdrawals.service.js';

export const withdrawalsController = {
  async create(req, res) {
    const created = await withdrawalsService.create(req.body, req.user.id);
    return res.status(201).json({ data: created });
  },

  async delete(req, res) {
    const result = await withdrawalsService.delete(req.params.id);
    return res.status(200).json({ data: result });
  },
};
