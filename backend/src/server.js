import { env } from './config/env.js';
import { createApp } from './app.js';
import { pool, closePool } from './db/pool.js';

const startServer = async () => {
  try {
    console.log('⏳ Verificando conexión a Neon PostgreSQL...');
    await pool.query('SELECT 1 AS conn_check;');
    console.log('✅ Conexión a la base de datos confirmada.');

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Servidor iniciado en el puerto ${env.PORT} [entorno: ${env.NODE_ENV}]`);
      console.log(`📡 Base API: http://localhost:${env.PORT}/api`);
      console.log(`🩺 Health check: http://localhost:${env.PORT}/api/health`);
    });

    let isShuttingDown = false;

    const gracefulShutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`\n🛑 Señal ${signal} recibida. Cerrando servidor de forma ordenada...`);

      // Timeout de seguridad de 10 segundos
      const forceExit = setTimeout(() => {
        console.error('⚠️ Apagado forzado por superar el tiempo límite de espera.');
        process.exit(1);
      }, 10000);
      forceExit.unref();

      server.close(async (err) => {
        if (err) {
          console.error('❌ Error al detener el servidor HTTP:', err.message);
          process.exit(1);
        }
        console.log('🔒 Servidor HTTP cerrado sin aceptar nuevas conexiones.');

        try {
          await closePool();
          console.log('🔒 Conexiones del pool de PostgreSQL cerradas.');
          console.log('👋 Servidor apagado completamente.');
          process.exit(0);
        } catch (dbErr) {
          console.error('❌ Error al cerrar el pool de la base de datos:', dbErr.message);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ Error crítico durante el arranque del servidor:\n', err.message);
    process.exit(1);
  }
};

startServer();
