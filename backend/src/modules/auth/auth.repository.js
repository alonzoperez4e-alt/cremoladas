import { query } from '../../db/pool.js';

/**
 * Repositorio de base de datos para la entidad de usuarios y autenticación.
 * Ejecuta exclusivamente consultas SQL parametrizadas directas con pg.
 */
export const authRepository = {
  /**
   * Busca un usuario por su nombre de usuario de forma insensible a mayúsculas/minúsculas
   * @param {string} username
   * @returns {Promise<object|null>}
   */
  async findByUsername(username) {
    const text = `
      SELECT id, username, password_hash, full_name, is_active, created_at, updated_at
      FROM users
      WHERE LOWER(username) = LOWER($1)
      LIMIT 1;
    `;
    const res = await query(text, [username]);
    return res.rows[0] || null;
  },

  /**
   * Busca un usuario por ID sin exponer su password_hash
   * @param {string|number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const text = `
      SELECT id, username, full_name, is_active, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Busca un usuario por ID incluyendo password_hash para verificación de contraseña
   * @param {string|number} id
   * @returns {Promise<object|null>}
   */
  async findWithPasswordById(id) {
    const text = `
      SELECT id, username, password_hash, full_name, is_active, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Actualiza el hash de la contraseña y la fecha de actualización del usuario
   * @param {string|number} id
   * @param {string} passwordHash
   * @returns {Promise<object|null>}
   */
  async updatePassword(id, passwordHash) {
    const text = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, username, full_name, updated_at;
    `;
    const res = await query(text, [passwordHash, id]);
    return res.rows[0] || null;
  },

  /**
   * Inserta un nuevo usuario (utilizado principalmente para inicialización y seeds)
   * @param {object} params
   * @param {string} params.username
   * @param {string} params.passwordHash
   * @param {string} [params.fullName]
   * @param {boolean} [params.isActive=true]
   * @returns {Promise<object>}
   */
  async create({ username, passwordHash, fullName = null, isActive = true }) {
    const text = `
      INSERT INTO users (username, password_hash, full_name, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, username, full_name, is_active, created_at, updated_at;
    `;
    const res = await query(text, [username, passwordHash, fullName, isActive]);
    return res.rows[0];
  },
};
