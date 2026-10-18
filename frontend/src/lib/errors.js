/**
 * Diccionario de traducción de códigos de error de la API a mensajes amigables en español
 */
export const ERROR_MESSAGES = {
  // Autenticación
  INVALID_CREDENTIALS: 'El usuario o la contraseña son incorrectos.',
  TOKEN_MISSING: 'No se encontró una sesión activa.',
  TOKEN_INVALID: 'Tu sesión no es válida. Por favor, inicia sesión nuevamente.',
  TOKEN_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  INSUFFICIENT_PERMISSIONS: 'No tienes permisos para realizar esta acción.',
  SAME_PASSWORD: 'La nueva contraseña debe ser diferente a la contraseña actual.',
  INVALID_PASSWORD: 'La contraseña actual ingresada es incorrecta.',

  // Sabores y materiales
  FLAVOR_NAME_EXISTS: 'Ya existe un sabor activo con este nombre.',
  FLAVOR_NOT_FOUND: 'Uno o más sabores seleccionados no existen o están inactivos.',
  FLAVOR_SOLD_OUT: 'Uno o más sabores seleccionados se encuentran agotados.',
  MATERIAL_NAME_EXISTS: 'Ya existe un material activo con este nombre.',
  MATERIAL_NOT_FOUND: 'El material seleccionado no fue encontrado.',

  // Negocio y ventas
  DAY_ALREADY_STARTED: 'Ya existe una jornada de ventas iniciada para hoy.',
  DAY_NOT_STARTED: 'Aún no se ha iniciado la jornada de ventas de hoy.',
  NO_OPEN_DAY: 'No hay ninguna jornada de ventas abierta para registrar ventas.',
  DAY_ALREADY_CLOSED: 'La jornada de ventas ya ha sido cerrada previamente.',
  DAY_CLOSED: 'La jornada de ventas de hoy se encuentra cerrada.',
  INVALID_EXPENSE_DATE: 'La fecha del gasto no puede ser posterior a hoy.',
  INVALID_PREP_DATE: 'La fecha de preparación no puede ser posterior a hoy.',

  // Generales
  VALIDATION_ERROR: 'Por favor, revisa los datos ingresados en el formulario.',
  CONFLICT: 'El registro que intentas guardar entra en conflicto con uno existente.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  TOO_MANY_REQUESTS: 'Demasiadas solicitudes. Por favor, espera un momento antes de reintentar.',
  INTERNAL_SERVER_ERROR: 'Ocurrió un error en el servidor. Por favor, intenta más tarde.',
};

/**
 * Traduce un objeto de error (de axios o genérico) a un mensaje legible en español
 * @param {Error|Object} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (!error) return 'Ocurrió un error inesperado.';

  // Error proveniente de respuesta HTTP de Axios
  if (error.response) {
    const data = error.response.data;
    const status = error.response.status;

    // Formato estándar de la API: { error: { code, message, details } }
    if (data?.error?.code && ERROR_MESSAGES[data.error.code]) {
      return ERROR_MESSAGES[data.error.code];
    }

    if (data?.error?.message) {
      return data.error.message;
    }

    if (status === 429) {
      return 'Demasiados intentos fallidos. Por favor, espera un momento antes de volver a intentar.';
    }

    if (status === 404) {
      return 'El recurso solicitado no existe.';
    }

    if (status >= 500) {
      return 'Error temporal del servidor. Por favor, intenta de nuevo en unos momentos.';
    }
  }

  // Error de red (sin conexión con el backend)
  if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet o si el backend está activo.';
  }

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'La solicitud tardó demasiado en responder. Intenta de nuevo.';
  }

  return error.message || 'Ocurrió un error inesperado.';
}

/**
 * Helper para asignar errores de validación de la API (details) a los campos de react-hook-form
 * @param {Object} error - Error de Axios
 * @param {Function} setError - Función setError provista por useForm
 */
export function setFormErrorsFromApi(error, setError) {
  const details = error?.response?.data?.error?.details;
  if (!Array.isArray(details) || !setError) return false;

  let assignedAny = false;
  details.forEach((item) => {
    // Si item tiene field y message
    const field = item.field || item.path?.[0] || item.param;
    const message = item.message || item.error || 'Dato inválido';
    if (field) {
      setError(field, { type: 'server', message });
      assignedAny = true;
    }
  });

  return assignedAny;
}
