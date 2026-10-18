import dotenv from 'dotenv';
dotenv.config();

import { authRepository } from '../src/modules/auth/auth.repository.js';
import { hashPassword } from '../src/utils/password.js';
import { closePool } from '../src/db/pool.js';

const runSeed = async () => {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME?.trim() || 'Administrador del Sistema';
  const isResetRequested = process.argv.includes('--reset-password');

  if (!username) {
    console.error('❌ Error: La variable de entorno ADMIN_USERNAME es obligatoria.');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error(
      '❌ Error: La variable de entorno ADMIN_PASSWORD es obligatoria y debe tener al menos 8 caracteres.'
    );
    process.exit(1);
  }

  try {
    console.log(`\n🔍 Verificando existencia del usuario administrador '${username}'...`);
    const existing = await authRepository.findByUsername(username);

    if (existing) {
      if (isResetRequested) {
        console.log(`🔄 Flag --reset-password detectado. Hasheando nueva contraseña...`);
        const newHash = await hashPassword(password);
        await authRepository.updatePassword(existing.id, newHash);
        console.log(`✅ Contraseña del usuario '${username}' actualizada correctamente.`);
      } else {
        console.log(`ℹ️ El usuario administrador '${username}' ya existe en la base de datos.`);
        console.log('   No se realizaron modificaciones (operación idempotente).');
        console.log(
          '   Para forzar el cambio de contraseña, ejecute: npm run seed:admin -- --reset-password\n'
        );
      }
    } else {
      console.log(`🌱 Creando usuario administrador '${username}'...`);
      const passwordHash = await hashPassword(password);
      const created = await authRepository.create({
        username,
        passwordHash,
        fullName,
        isActive: true,
      });
      console.log(
        `✅ Usuario administrador '${created.username}' creado exitosamente con ID ${created.id}.`
      );
    }
  } catch (err) {
    console.error('❌ Error al ejecutar el seed del administrador:', err.message);
    process.exit(1);
  } finally {
    await closePool();
  }
};

runSeed();
