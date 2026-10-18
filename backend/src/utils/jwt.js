import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Genera un token JWT firmado con HS256
 * @param {object} payload - Carga útil (debe incluir sub y username)
 * @param {jwt.SignOptions} [options={}] - Opciones adicionales de firma
 * @returns {string} Token JWT
 */
export const signToken = (payload, options = {}) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
    ...options,
  });
};

/**
 * Verifica y decodifica un token JWT
 * @param {string} token - Token JWT
 * @returns {object} Payload decodificado
 */
export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'],
  });
};
