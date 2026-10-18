import { statsRepository } from './stats.repository.js';

export const statsService = {
  async getSummary() {
    return statsRepository.getBusinessSummary();
  },
};
