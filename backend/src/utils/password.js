import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../config/constants.js';

// Hash ficticio precalculado con bcrypt cost factor 12 para mitigar ataques de temporización (timing attacks)
// cuando un usuario no existe en la base de datos.
const DUMMY_HASH = '$2a$12$4v0P6mG4yH42dK8yYm8NKe0g2V4k7c6VjJ5p4l1Z9b8u7e6w5r4t3';

/**
 * Hashea una contraseña usando bcrypt con factor de costo 12
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Hash de la contraseña
 */
export const hashPassword = async (password) => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Compara una contraseña en texto plano contra un hash bcrypt
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash guardado
 * @returns {Promise<boolean>} True si coinciden
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Ejecuta compare contra un hash ficticio de 12 rondas para igualar el tiempo de cómputo
 * cuando un usuario no existe en la base de datos.
 * @param {string} password - Contraseña enviada
 * @returns {Promise<boolean>} Siempre retorna false
 */
export const compareDummyPassword = async (password) => {
  await bcrypt.compare(password, DUMMY_HASH);
  return false;
};
