import { salesDaysRepository } from './sales-days.repository.js';
import { getTodayLima, closeOverdueSalesDays } from '../../utils/date.js';
import { AppError } from '../../utils/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';

export const salesDaysService = {
  async getTodayStatus() {
    await closeOverdueSalesDays();
    const todayLima = await getTodayLima();
    const salesDay = await salesDaysRepository.findByDate(todayLima);

    if (!salesDay) {
      return {
        date: todayLima,
        status: 'not_started',
        salesDay: null,
        totals: {
          salesCount: 0,
          cupsSold: 0,
          totalSold: 0,
        },
      };
    }

    const totals = await salesDaysRepository.getTotalsByDayId(salesDay.id);

    return {
      date: todayLima,
      status: salesDay.status,
      salesDay,
      totals,
    };
  },

  async startTodayDay(userId) {
    await closeOverdueSalesDays();
    const todayLima = await getTodayLima();

    const existing = await salesDaysRepository.findByDate(todayLima);
    if (existing) {
      throw new AppError(
        409,
        ERROR_CODES.DAY_ALREADY_STARTED,
        'Ya existe una jornada iniciada para hoy'
      );
    }

    try {
      const created = await salesDaysRepository.create(todayLima, userId);
      return {
        date: todayLima,
        status: 'open',
        salesDay: created,
        totals: {
          salesCount: 0,
          cupsSold: 0,
          totalSold: 0,
        },
      };
    } catch (err) {
      if (err.code === '23505') {
        throw new AppError(
          409,
          ERROR_CODES.DAY_ALREADY_STARTED,
          'Ya existe una jornada iniciada para hoy'
        );
      }
      throw err;
    }
  },

  async closeTodayDay() {
    await closeOverdueSalesDays();
    const todayLima = await getTodayLima();

    const salesDay = await salesDaysRepository.findByDate(todayLima);
    if (!salesDay) {
      throw new AppError(
        404,
        ERROR_CODES.DAY_NOT_STARTED,
        'No existe una jornada iniciada para hoy'
      );
    }

    if (salesDay.status === 'closed') {
      throw new AppError(
        409,
        ERROR_CODES.DAY_ALREADY_CLOSED,
        'La jornada de hoy ya fue cerrada previamente'
      );
    }

    const closed = await salesDaysRepository.closeDay(salesDay.id);
    const totals = await salesDaysRepository.getTotalsByDayId(salesDay.id);

    return {
      date: todayLima,
      status: 'closed',
      salesDay: closed,
      totals,
    };
  },

  async getTodaySales() {
    await closeOverdueSalesDays();
    const todayLima = await getTodayLima();

    const salesDay = await salesDaysRepository.findByDate(todayLima);
    if (!salesDay) {
      throw new AppError(
        404,
        ERROR_CODES.DAY_NOT_STARTED,
        'No existe una jornada iniciada para hoy'
      );
    }

    const totals = await salesDaysRepository.getTotalsByDayId(salesDay.id);
    const sales = await salesDaysRepository.getDaySales(salesDay.id);
    const byFlavor = await salesDaysRepository.getDayFlavorStats(salesDay.id);

    return {
      salesDay,
      totals,
      sales,
      byFlavor,
    };
  },

  async getHistory({ page = 1, pageSize = 20, from, to } = {}) {
    await closeOverdueSalesDays();
    const todayLima = await getTodayLima();

    if (from && from > todayLima) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'La fecha inicial (from) no puede ser posterior a hoy');
    }
    if (to && to > todayLima) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'La fecha final (to) no puede ser posterior a hoy');
    }
    if (from && to && from > to) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'La fecha inicial no puede ser mayor que la fecha final');
    }

    const { items, total } = await salesDaysRepository.findPaginatedHistory({
      page,
      pageSize,
      from,
      to,
    });

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
      },
    };
  },
};
