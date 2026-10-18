import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

// Configuración de conexión con SSL para Neon PostgreSQL
const sslConfig = env.DATABASE_URL.includes('sslmode=disable')
  ? false
  : {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true,
    };

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Manejo de errores en clientes inactivos para evitar que el proceso se caiga
pool.on('error', (err) => {
  console.error('⚠️ Error inesperado en un cliente inactivo del pool de PostgreSQL:', err.message);
});

/**
 * Ejecuta una consulta SQL parametrizada utilizando el pool
 * @param {string} text - Consulta SQL con placeholders ($1, $2, ...)
 * @param {Array} [params=[]] - Parámetros de la consulta
 * @returns {Promise<pg.QueryResult>} Resultado de la consulta
 */
export const query = async (text, params = []) => {
  return pool.query(text, params);
};

let customTransactionRunner = null;

export const setTransactionRunnerForTesting = (runner) => {
  customTransactionRunner = runner;
};

/**
 * Ejecuta un conjunto de operaciones dentro de una transacción segura de PostgreSQL
 * Asegura BEGIN, COMMIT y ROLLBACK ante cualquier error, liberando siempre el cliente.
 * @param {Function} callback - Función asíncrona que recibe el cliente de la transacción: async (client) => { ... }
 * @returns {Promise<*>} El resultado retornado por el callback
 */
export const withTransaction = async (callback) => {
  if (customTransactionRunner) {
    return customTransactionRunner(callback);
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Error durante el rollback de la transacción:', rollbackErr.message);
    }
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Comprueba la salud de la conexión a la base de datos
 * @returns {Promise<boolean>} True si la consulta SELECT 1 responde exitosamente
 */
export const checkDbHealth = async () => {
  try {
    const res = await pool.query('SELECT 1 AS alive;');
    return res.rows?.[0]?.alive === 1;
  } catch (err) {
    console.error('Error al verificar la salud de la base de datos:', err.message);
    return false;
  }
};

/**
 * Cierra ordenadamente el pool de conexiones
 * @returns {Promise<void>}
 */
export const closePool = async () => {
  await pool.end();
};
