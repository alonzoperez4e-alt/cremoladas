import { materialsService } from './materials.service.js';

export const materialsController = {
  async getAll(req, res) {
    const materials = await materialsService.getAll();
    return res.status(200).json({ data: materials });
  },

  async create(req, res) {
    const created = await materialsService.create(req.body);
    return res.status(201).json({ data: created });
  },

  async update(req, res) {
    const updated = await materialsService.update(req.params.id, req.body);
    return res.status(200).json({ data: updated });
  },

  async delete(req, res) {
    const result = await materialsService.delete(req.params.id);
    return res.status(200).json({ data: result });
  },
};
