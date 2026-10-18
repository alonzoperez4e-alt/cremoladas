import { flavorsRepository } from './flavors.repository.js';
import { AppError } from '../../utils/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';

export const flavorsService = {
  async getAll({ availableOnly = false } = {}) {
    return flavorsRepository.findAll({ availableOnly });
  },

  async getById(id) {
    const flavor = await flavorsRepository.findById(id);
    if (!flavor) {
      throw new AppError(404, ERROR_CODES.FLAVOR_NOT_FOUND, 'El sabor solicitado no existe o no está activo');
    }
    return flavor;
  },

  async create({ name, color, icon }) {
    const existing = await flavorsRepository.findActiveByName(name);
    if (existing) {
      throw new AppError(
        409,
        ERROR_CODES.FLAVOR_NAME_EXISTS,
        `Ya existe un sabor activo con el nombre "${name}"`
      );
    }
    return flavorsRepository.create({ name, color, icon });
  },

  async update(id, { name, color, icon }) {
    await this.getById(id);

    const duplicate = await flavorsRepository.findActiveByName(name, id);
    if (duplicate) {
      throw new AppError(
        409,
        ERROR_CODES.FLAVOR_NAME_EXISTS,
        `Ya existe otro sabor activo con el nombre "${name}"`
      );
    }

    return flavorsRepository.update(id, { name, color, icon });
  },

  async setSoldOut(id, isSoldOut) {
    await this.getById(id);
    return flavorsRepository.updateSoldOut(id, isSoldOut);
  },

  async delete(id) {
    const deleted = await flavorsRepository.softDelete(id);
    if (!deleted) {
      throw new AppError(404, ERROR_CODES.FLAVOR_NOT_FOUND, 'El sabor solicitado no existe o ya fue eliminado');
    }
    return { message: 'Sabor eliminado exitosamente' };
  },
};
