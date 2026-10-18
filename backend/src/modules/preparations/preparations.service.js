import { preparationsRepository } from './preparations.repository.js';
import { flavorsRepository } from '../flavors/flavors.repository.js';
import { getTodayLima } from '../../utils/date.js';
import { AppError } from '../../utils/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';

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

  async create({ flavorId, investmentAmount, prepDate, description }, userId) {
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

    return preparationsRepository.create({
      flavorId,
      prepDate: finalDate,
      investmentAmount,
      description: description || null,
      createdBy: userId,
    });
  },

  async update(id, { flavorId, investmentAmount, prepDate, description }) {
    const existing = await preparationsRepository.findById(id);
    if (!existing) {
      throw new AppError(404, ERROR_CODES.PREPARATION_NOT_FOUND, 'La preparación solicitada no existe');
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
    const finalDate = prepDate || existing.prepDate;

    if (finalDate > todayLima) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'La fecha de preparación no puede ser posterior a la fecha actual (Lima)'
      );
    }

    return preparationsRepository.update(id, {
      flavorId,
      prepDate: finalDate,
      investmentAmount,
      description: description || null,
    });
  },

  async delete(id) {
    const deleted = await preparationsRepository.delete(id);
    if (!deleted) {
      throw new AppError(404, ERROR_CODES.PREPARATION_NOT_FOUND, 'La preparación solicitada no existe');
    }
    return { message: 'Preparación eliminada exitosamente' };
  },
};
