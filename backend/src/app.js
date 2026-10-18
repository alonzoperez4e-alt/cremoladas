import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiRateLimiter } from './middlewares/rateLimiters.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import apiRoutes from './routes/index.js';
import { AppError } from './utils/AppError.js';
import { ERROR_CODES } from './config/constants.js';

export const createApp = () => {
  const app = express();

  // Configuración de trust proxy si el servidor corre detrás de un reverse proxy (Render, Railway, etc.)
  if (env.TRUST_PROXY) {
    app.set('trust proxy', env.TRUST_PROXY);
  }

  // Seguridad HTTP con Helmet
  app.use(helmet());

  // Configuración de CORS restringido a los orígenes definidos en CLIENT_URL
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir peticiones sin encabezado Origin (curl, herramientas locales, llamadas server-to-server)
        if (!origin) return callback(null, true);

        if (env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(
          new AppError(
            403,
            ERROR_CODES.CORS_ERROR,
            `El origen ${origin} no está autorizado por la política de CORS`
          )
        );
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );

  // Registro de peticiones HTTP con Morgan
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));

  // Parseo de cuerpo JSON limitado a 100kb para prevenir ataques DoS
  app.use(express.json({ limit: '100kb' }));

  // Limitador de tasa global para todas las rutas del API
  app.use('/api', apiRateLimiter);

  // Montar todas las rutas del sistema bajo el prefijo /api
  app.use('/api', apiRoutes);

  // Middleware 404 para cualquier ruta no mapeada
  app.use(notFound);

  // Middleware centralizado de gestión de errores
  app.use(errorHandler);

  return app;
};

export default createApp;
