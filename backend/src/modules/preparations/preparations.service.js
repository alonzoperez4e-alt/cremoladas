import { preparationsRepository } from './preparations.repository.js';
import { flavorsRepository } from '../flavors/flavors.repository.js';
import { getTodayLima } from '../../utils/date.js';
import { AppError } from '../../utils/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';
import { withTransaction } from '../../db/pool.js';
import { lockBalances, getBalances, assertInvariants, toCents } from '../../utils/balance.js';

export const preparationsService = {
  async getPaginated({ page = 1, pageSize = 20, from, to, flavorId } = {}) {
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

    const { items, total, totalAmount } = await preparationsRepository.findPaginated({
      page,
      pageSize,
      from,
      to,
      flavorId,
    });

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
      },
      summary: {
        totalAmount,
      },
    };
  },

  async create({ flavorId, investmentAmount, prepDate, description, payment }, userId) {
    const sumCents = toCents(payment?.cashAmount) + toCents(payment?.yapeAmount) + toCents(payment?.ownAmount);
    if (sumCents !== toCents(investmentAmount)) {
      throw new AppError(
        400,
        ERROR_CODES.PAYMENT_SUM_MISMATCH,
        'La suma de los orígenes de pago debe ser exactamente igual al monto de inversión'
      );
    }

    const flavor = await flavorsRepository.findById(flavorId);
    if (!flavor || !flavor.isActive) {
      throw new AppError(
        400,
        ERROR_CODES.FLAVOR_NOT_FOUND,
        'El sabor especificado no existe o no se encuentra activo'
      );
    }

    const todayLima = await getTodayLima();
    const finalDate = prepDate || todayLima;

    if (finalDate > todayLima) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'La fecha de preparación no puede ser posterior a la fecha actual (Lima)'
      );
    }

    return withTransaction(async (client) => {
      await lockBalances(client);
      const preBalances = await getBalances(client);

      const created = await preparationsRepository.create(
        {
          flavorId,
          prepDate: finalDate,
          investmentAmount,
          description: description || null,
          createdBy: userId,
          paidCash: payment.cashAmount,
          paidYape: payment.yapeAmount,
          paidOwn: payment.ownAmount,
        },
        client
      );

      await assertInvariants(client, {
        preBalances,
        requestedCash: payment.cashAmount,
        requestedYape: payment.yapeAmount,
      });

      return created;
    });
  },

  async update(id, { flavorId, investmentAmount, prepDate, description, payment }) {
    const sumCents = toCents(payment?.cashAmount) + toCents(payment?.yapeAmount) + toCents(payment?.ownAmount);
    if (sumCents !== toCents(investmentAmount)) {
      throw new AppError(
        400,
        ERROR_CODES.PAYMENT_SUM_MISMATCH,
        'La suma de los orígenes de pago debe ser exactamente igual al monto de inversión'
      );
    }

    const flavor = await flavorsRepository.findById(flavorId);
    if (!flavor || !flavor.isActive) {
      throw new AppError(
        400,
        ERROR_CODES.FLAVOR_NOT_FOUND,
        'El sabor especificado no existe o no se encuentra activo'
      );
    }

    const todayLima = await getTodayLima();

    return withTransaction(async (client) => {
      await lockBalances(client);
      const existing = await preparationsRepository.findById(id, client);
      if (!existing) {
        throw new AppError(404, ERROR_CODES.PREPARATION_NOT_FOUND, 'La preparación solicitada no existe');
      }

      const finalDate = prepDate || existing.prepDate;
      if (finalDate > todayLima) {
        throw new AppError(
          400,
          ERROR_CODES.VALIDATION_ERROR,
          'La fecha de preparación no puede ser posterior a la fecha actual (Lima)'
        );
      }

      const preBalances = await getBalances(client);

      const updated = await preparationsRepository.update(
        id,
        {
          flavorId,
          prepDate: finalDate,
          investmentAmount,
          description: description || null,
          paidCash: payment.cashAmount,
          paidYape: payment.yapeAmount,
          paidOwn: payment.ownAmount,
        },
        client
      );

      await assertInvariants(client, {
        preBalances,
        requestedCash: payment.cashAmount,
        requestedYape: payment.yapeAmount,
      });

      return updated;
    });
  },

  async delete(id) {
    return withTransaction(async (client) => {
      await lockBalances(client);
      const existing = await preparationsRepository.findById(id, client);
      if (!existing) {
        throw new AppError(404, ERROR_CODES.PREPARATION_NOT_FOUND, 'La preparación solicitada no existe');
      }

      const preBalances = await getBalances(client);

      await preparationsRepository.delete(id, client);

      await assertInvariants(client, { preBalances });

      return { message: 'Preparación eliminada exitosamente' };
    });
  },
};
