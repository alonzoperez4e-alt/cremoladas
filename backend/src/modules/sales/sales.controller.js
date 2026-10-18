import { salesService } from './sales.service.js';

export const salesController = {
  async create(req, res) {
    const sale = await salesService.createSale(req.body, req.user.id);
    return res.status(201).json({ data: sale });
  },
};
