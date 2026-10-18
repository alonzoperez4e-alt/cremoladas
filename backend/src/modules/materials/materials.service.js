import { materialsRepository } from './materials.repository.js';
import { AppError } from '../../utils/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';

export const materialsService = {
  async getAll() {
    return materialsRepository.findAllActive();
  },

  async getById(id) {
    const material = await materialsRepository.findById(id);
    if (!material) {
      throw new AppError(404, ERROR_CODES.MATERIAL_NOT_FOUND, 'El material solicitado no existe o no está activo');
    }
    return material;
  },

  async create({ name }) {
    const existing = await materialsRepository.findActiveByName(name);
    if (existing) {
      throw new AppError(
        409,
        ERROR_CODES.MATERIAL_NAME_EXISTS,
        `Ya existe un material activo con el nombre "${name}"`
      );
    }
    return materialsRepository.create(name);
  },

  async update(id, { name }) {
    await this.getById(id);

    const duplicate = await materialsRepository.findActiveByName(name, id);
    if (duplicate) {
      throw new AppError(
        409,
        ERROR_CODES.MATERIAL_NAME_EXISTS,
        `Ya existe otro material activo con el nombre "${name}"`
      );
    }

    return materialsRepository.update(id, name);
  },

  async delete(id) {
    const deleted = await materialsRepository.softDelete(id);
    if (!deleted) {
      throw new AppError(404, ERROR_CODES.MATERIAL_NOT_FOUND, 'El material solicitado no existe o ya fue eliminado');
    }
    return { message: 'Material eliminado exitosamente' };
  },
};
