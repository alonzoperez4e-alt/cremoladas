import { expensesRepository } from './expenses.repository.js';
import { materialsRepository } from '../materials/materials.repository.js';
import { getTodayLima } from '../../utils/date.js';
import { AppError } from '../../utils/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';

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

  async create({ materialId, amount, expenseDate, description }, userId) {
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

    return expensesRepository.create({
      materialId,
      expenseDate: finalDate,
      amount,
      description: description || null,
      createdBy: userId,
    });
  },

  async update(id, { materialId, amount, expenseDate, description }) {
    const existing = await expensesRepository.findById(id);
    if (!existing) {
      throw new AppError(404, ERROR_CODES.EXPENSE_NOT_FOUND, 'El gasto solicitado no existe');
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
    const finalDate = expenseDate || existing.expenseDate;

    if (finalDate > todayLima) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'La fecha del gasto no puede ser posterior a la fecha actual (Lima)'
      );
    }

    return expensesRepository.update(id, {
      materialId,
      expenseDate: finalDate,
      amount,
      description: description || null,
    });
  },

  async delete(id) {
    const deleted = await expensesRepository.delete(id);
    if (!deleted) {
      throw new AppError(404, ERROR_CODES.EXPENSE_NOT_FOUND, 'El gasto solicitado no existe');
    }
    return { message: 'Gasto eliminado exitosamente' };
  },
};
