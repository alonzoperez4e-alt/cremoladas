import { transactionsRepository } from './transactions.repository.js';
import { AppError } from '../../utils/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';

export const transactionsService = {
  async getPaginated({ page = 1, pageSize = 20, from, to, type, account } = {}) {
    if (from && to && from > to) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'La fecha inicial no puede ser mayor que la fecha final');
    }

    const { items, total, totalIn, totalOut } = await transactionsRepository.findPaginated({
      page,
      pageSize,
      from,
      to,
      type,
      account,
    });

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
      },
      summary: {
        totalIn,
        totalOut,
      },
    };
  },
};
