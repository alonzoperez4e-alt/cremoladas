import cron from 'node-cron';
import { closeOverdueSalesDays } from '../utils/date.js';
import { env } from '../config/env.js';

let midnightJob = null;
let backupJob = null;

/**
 * Inicia las tareas programadas para el cierre automático de jornadas abiertas
 * que correspondan a días pasados respecto a la hora de Lima (America/Lima).
 */
export const startCloseOverdueDaysJob = () => {
  if (!env.ENABLE_CRON) {
    console.log('ℹ️ Cron de cierre automático de jornadas deshabilitado por configuración (ENABLE_CRON=false).');
    return;
  }

  // 1. Tarea programada exactamente a las 00:00 (hora de Lima)
  midnightJob = cron.schedule(
    '0 0 * * *',
    async () => {
      try {
        console.log('⏰ Ejecutando cron de medianoche: cierre automático de jornadas vencidas (Lima)...');
        const closed = await closeOverdueSalesDays();
        if (closed > 0) {
          console.log(`✅ Cron de medianoche: se cerraron ${closed} jornada(s) vencida(s).`);
        }
      } catch (err) {
        console.error('❌ Error en cron de medianoche al cerrar jornadas:', err.message);
      }
    },
    {
      timezone: 'America/Lima',
    }
  );

  // 2. Tarea de respaldo periódica cada 10 minutos
  backupJob = cron.schedule('*/10 * * * *', async () => {
    try {
      const closed = await closeOverdueSalesDays();
      if (closed > 0) {
        console.log(`✅ Cron de respaldo (cada 10 min): se cerraron ${closed} jornada(s) vencida(s).`);
      }
    } catch (err) {
      console.error('❌ Error en cron de respaldo al cerrar jornadas:', err.message);
    }
  });

  console.log('🕒 Cron jobs de cierre automático de jornadas iniciados exitosamente (America/Lima).');
};

/**
 * Detiene los cron jobs ordenadamente
 */
export const stopCloseOverdueDaysJob = () => {
  if (midnightJob) {
    midnightJob.stop();
    midnightJob = null;
  }
  if (backupJob) {
    backupJob.stop();
    backupJob = null;
  }
  console.log('🛑 Cron jobs de cierre de jornadas detenidos.');
};
