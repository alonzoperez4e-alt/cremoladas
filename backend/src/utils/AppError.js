export class AppError extends Error {
  /**
   * @param {number} statusCode - Código de estado HTTP
   * @param {string} code - Código legible de error de la aplicación (ej: VALIDATION_ERROR)
   * @param {string} message - Mensaje descriptivo para el cliente
   * @param {Array} [details=[]] - Detalles adicionales del error (ej: errores de campos)
   */
  constructor(statusCode, code, message, details = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
