import { expensesRepository } from './expenses.repository.js';
import { materialsRepository } from '../materials/materials.repository.js';
import { getTodayLima } from '../../utils/date.js';
import { AppError } from '../../utils/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';
import { withTransaction } from '../../db/pool.js';
import { lockBalances, getBalances, assertInvariants, toCents } from '../../utils/balance.js';

export const expensesService = {
  async getPaginated({ page = 1, pageSize = 20, from, to, materialId } = {}) {
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

    const { items, total, totalAmount } = await expensesRepository.findPaginated({
      page,
      pageSize,
      from,
      to,
      materialId,
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

  async create({ materialId, amount, expenseDate, description, payment }, userId) {
    const sumCents = toCents(payment?.cashAmount) + toCents(payment?.yapeAmount) + toCents(payment?.ownAmount);
    if (sumCents !== toCents(amount)) {
      throw new AppError(
        400,
        ERROR_CODES.PAYMENT_SUM_MISMATCH,
        'La suma de los orígenes de pago debe ser exactamente igual al monto del gasto'
      );
    }

    const material = await materialsRepository.findById(materialId);
    if (!material || !material.isActive) {
      throw new AppError(
        400,
        ERROR_CODES.MATERIAL_NOT_FOUND,
        'El material especificado no existe o no se encuentra activo'
      );
    }

    const todayLima = await getTodayLima();
    const finalDate = expenseDate || todayLima;

    if (finalDate > todayLima) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'La fecha del gasto no puede ser posterior a la fecha actual (Lima)'
      );
    }

    return withTransaction(async (client) => {
      await lockBalances(client);
      const preBalances = await getBalances(client);

      const created = await expensesRepository.create(
        {
          materialId,
          expenseDate: finalDate,
          amount,
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

  async update(id, { materialId, amount, expenseDate, description, payment }) {
    const sumCents = toCents(payment?.cashAmount) + toCents(payment?.yapeAmount) + toCents(payment?.ownAmount);
    if (sumCents !== toCents(amount)) {
      throw new AppError(
        400,
        ERROR_CODES.PAYMENT_SUM_MISMATCH,
        'La suma de los orígenes de pago debe ser exactamente igual al monto del gasto'
      );
    }

    const material = await materialsRepository.findById(materialId);
    if (!material || !material.isActive) {
      throw new AppError(
        400,
        ERROR_CODES.MATERIAL_NOT_FOUND,
        'El material especificado no existe o no se encuentra activo'
      );
    }

    const todayLima = await getTodayLima();

    return withTransaction(async (client) => {
      await lockBalances(client);
      const existing = await expensesRepository.findById(id, client);
      if (!existing) {
        throw new AppError(404, ERROR_CODES.EXPENSE_NOT_FOUND, 'El gasto solicitado no existe');
      }

      const finalDate = expenseDate || existing.expenseDate;
      if (finalDate > todayLima) {
        throw new AppError(
          400,
          ERROR_CODES.VALIDATION_ERROR,
          'La fecha del gasto no puede ser posterior a la fecha actual (Lima)'
        );
      }

      const preBalances = await getBalances(client);

      const updated = await expensesRepository.update(
        id,
        {
          materialId,
          expenseDate: finalDate,
          amount,
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
      const existing = await expensesRepository.findById(id, client);
      if (!existing) {
        throw new AppError(404, ERROR_CODES.EXPENSE_NOT_FOUND, 'El gasto solicitado no existe');
      }

      const preBalances = await getBalances(client);

      await expensesRepository.delete(id, client);

      await assertInvariants(client, { preBalances });

      return { message: 'Gasto eliminado exitosamente' };
    });
  },
};
