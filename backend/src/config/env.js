import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string({
    required_error: 'La variable DATABASE_URL es obligatoria',
  }).min(1, 'La variable DATABASE_URL no puede estar vacía'),
  JWT_SECRET: z.string({
    required_error: 'La variable JWT_SECRET es obligatoria',
  }).min(32, 'La variable JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CLIENT_URL: z.string({
    required_error: 'La variable CLIENT_URL es obligatoria',
  }).min(1, 'La variable CLIENT_URL no puede estar vacía'),
  TRUST_PROXY: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false || val === undefined) return false;
      const num = Number(val);
      return !isNaN(num) ? num : val;
    }, z.union([z.boolean(), z.number(), z.string()]))
    .default(false),
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_LOGIN_WINDOW_MINS: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_GLOBAL_WINDOW_MINS: z.coerce.number().int().positive().default(15),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ Error crítico de configuración: Variables de entorno faltantes o inválidas:\n');
  parsed.error.issues.forEach((issue) => {
    const field = issue.path.join('.') || 'ENV';
    console.error(`  - [${field}]: ${issue.message}`);
  });
  console.error('\nPor favor verifique su archivo .env basándose en .env.example y reinicie la aplicación.\n');
  process.exit(1);
}

const rawEnv = parsed.data;

export const env = {
  ...rawEnv,
  isProduction: rawEnv.NODE_ENV === 'production',
  isDevelopment: rawEnv.NODE_ENV === 'development',
  isTest: rawEnv.NODE_ENV === 'test',
  corsOrigins: rawEnv.CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean),
};
