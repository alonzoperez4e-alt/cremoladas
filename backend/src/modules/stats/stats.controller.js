import { statsService } from './stats.service.js';

export const statsController = {
  async getSummary(req, res) {
    const data = await statsService.getSummary();
    return res.status(200).json({ data });
  },
};
