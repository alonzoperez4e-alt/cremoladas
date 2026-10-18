/**
 * Envoltorio para controladores asíncronos que captura excepciones y las redirige a next(err)
 * @param {Function} fn - Función asíncrona (req, res, next)
 * @returns {Function} Express middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
