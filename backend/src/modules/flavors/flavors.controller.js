import { flavorsService } from './flavors.service.js';

export const flavorsController = {
  async getAll(req, res) {
    const availableOnly = req.query.available === 'true';
    const flavors = await flavorsService.getAll({ availableOnly });
    return res.status(200).json({ data: flavors });
  },

  async getById(req, res) {
    const flavor = await flavorsService.getById(req.params.id);
    return res.status(200).json({ data: flavor });
  },

  async create(req, res) {
    const created = await flavorsService.create(req.body);
    return res.status(201).json({ data: created });
  },

  async update(req, res) {
    const updated = await flavorsService.update(req.params.id, req.body);
    return res.status(200).json({ data: updated });
  },

  async setSoldOut(req, res) {
    const updated = await flavorsService.setSoldOut(req.params.id, req.body.isSoldOut);
    return res.status(200).json({ data: updated });
  },

  async delete(req, res) {
    const result = await flavorsService.delete(req.params.id);
    return res.status(200).json({ data: result });
  },
};
